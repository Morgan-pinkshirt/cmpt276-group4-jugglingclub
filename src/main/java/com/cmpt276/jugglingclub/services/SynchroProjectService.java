package com.cmpt276.jugglingclub.services;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

@Service
public class SynchroProjectService {

    public static final int MAX_ARCHIVE_BYTES = 25 * 1024 * 1024;
    private static final int MAX_AUDIO_BYTES = 25 * 1024 * 1024;
    private static final int MAX_JSON_BYTES = 1024 * 1024;
    private static final Set<String> ALLOWED_AUDIO_EXTENSIONS =
            Set.of("mp3", "wav", "ogg", "m4a", "flac");

    private final JsonMapper jsonMapper;

    public SynchroProjectService(JsonMapper jsonMapper) {
        this.jsonMapper = jsonMapper;
    }

    public record ProjectArchive(
            String projectName,
            String audioFileName,
            double durationSeconds,
            int momentCount,
            byte[] projectJson,
            byte[] audioData,
            byte[] archiveData) {
    }

    public ProjectArchive createArchive(String projectJson, MultipartFile audioFile) throws IOException {
        if (projectJson == null || projectJson.isBlank()) {
            throw new IllegalArgumentException("Project data is required.");
        }
        if (audioFile == null || audioFile.isEmpty()) {
            throw new IllegalArgumentException("An audio file is required.");
        }

        String audioFileName = safeFileName(audioFile.getOriginalFilename());
        checkAudioExtension(audioFileName);

        byte[] audioData;
        try (var input = audioFile.getInputStream()) {
            audioData = readLimited(input, MAX_AUDIO_BYTES);
        }
        if (audioData.length == 0) {
            throw new IllegalArgumentException("The audio file is empty.");
        }

        byte[] incomingJson = projectJson.getBytes(StandardCharsets.UTF_8);
        if (incomingJson.length > MAX_JSON_BYTES) {
            throw new IllegalArgumentException("Project data is too large.");
        }

        Map<String, Object> document = readProjectJson(incomingJson);
        Map<String, Object> audio = new LinkedHashMap<>();
        audio.put("file", "audio/" + audioFileName);
        audio.put("originalName", audioFile.getOriginalFilename());
        audio.put("type", audioFile.getContentType() == null ? "" : audioFile.getContentType());
        document.put("audio", audio);
        ProjectMetadata metadata = validateProject(document);

        byte[] normalizedJson = jsonMapper.writeValueAsBytes(document);
        if (normalizedJson.length > MAX_JSON_BYTES) {
            throw new IllegalArgumentException("Project data is too large.");
        }

        String folder = safeFolderName(metadata.projectName());
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        try (ZipOutputStream zip = new ZipOutputStream(output, StandardCharsets.UTF_8)) {
            zip.putNextEntry(new ZipEntry(folder + "/project.json"));
            zip.write(normalizedJson);
            zip.closeEntry();

            zip.putNextEntry(new ZipEntry(folder + "/audio/" + audioFileName));
            zip.write(audioData);
            zip.closeEntry();
        }

        byte[] archiveData = output.toByteArray();
        if (archiveData.length > MAX_ARCHIVE_BYTES) {
            throw new IllegalArgumentException("The ZIP file exceeds the 25 MB limit.");
        }

        return new ProjectArchive(metadata.projectName(), audioFileName,
                metadata.durationSeconds(), metadata.momentCount(),
                normalizedJson, audioData, archiveData);
    }

    public ProjectArchive readArchive(byte[] archiveData) throws IOException {
        if (archiveData == null || archiveData.length == 0) {
            throw new IllegalArgumentException("A ZIP file is required.");
        }
        if (archiveData.length > MAX_ARCHIVE_BYTES) {
            throw new IllegalArgumentException("The ZIP file exceeds the 25 MB limit.");
        }

        Map<String, byte[]> entries = new HashMap<>();
        long totalBytes = 0;
        try (ZipInputStream zip = new ZipInputStream(
                new ByteArrayInputStream(archiveData), StandardCharsets.UTF_8)) {
            ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) {
                String path = entry.getName();
                checkZipPath(path);
                if (!entry.isDirectory()) {
                    if (entries.size() >= 2 || entries.containsKey(path)) {
                        throw new IllegalArgumentException("The ZIP must contain exactly two files.");
                    }
                    int limit = path.endsWith("/project.json") || path.equals("project.json")
                            ? MAX_JSON_BYTES : MAX_AUDIO_BYTES;
                    byte[] content = readLimited(zip, limit);
                    totalBytes += content.length;
                    if (totalBytes > (long) MAX_AUDIO_BYTES + MAX_JSON_BYTES) {
                        throw new IllegalArgumentException("The extracted project is too large.");
                    }
                    entries.put(path, content);
                }
                zip.closeEntry();
            }
        }

        if (entries.size() != 2) {
            throw new IllegalArgumentException("The ZIP must contain project.json and one audio file.");
        }

        String projectPath = entries.keySet().stream()
                .filter(path -> path.equals("project.json") || path.endsWith("/project.json"))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("project.json is missing."));
        String folder = projectPath.substring(0, projectPath.length() - "project.json".length());
        if (!folder.isEmpty() && folder.substring(0, folder.length() - 1).contains("/")) {
            throw new IllegalArgumentException("Unexpected ZIP folder structure.");
        }

        byte[] projectJson = entries.get(projectPath);
        Map<String, Object> document = readProjectJson(projectJson);
        ProjectMetadata metadata = validateProject(document);
        String audioPath = folder + metadata.audioPath();
        byte[] audioData = entries.get(audioPath);
        if (audioData == null || audioData.length == 0) {
            throw new IllegalArgumentException("The project audio file is missing or empty.");
        }

        String audioFileName = metadata.audioPath().substring("audio/".length());
        checkAudioExtension(audioFileName);

        return new ProjectArchive(metadata.projectName(), audioFileName,
                metadata.durationSeconds(), metadata.momentCount(),
                projectJson, audioData, archiveData);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> readProjectJson(byte[] bytes) {
        try {
            Object value = jsonMapper.readValue(bytes, Object.class);
            if (!(value instanceof Map<?, ?>)) {
                throw new IllegalArgumentException("project.json must contain a JSON object.");
            }
            return (Map<String, Object>) value;
        } catch (JacksonException e) {
            throw new IllegalArgumentException("Invalid project.json.", e);
        }
    }

    private ProjectMetadata validateProject(Map<String, Object> document) {
        if (!(document.get("schemaVersion") instanceof Number version)
                || version.intValue() != 1 || version.doubleValue() != 1.0) {
            throw new IllegalArgumentException("Unsupported project version.");
        }
        if (!"synchro".equals(document.get("projectType"))) {
            throw new IllegalArgumentException("Invalid project type.");
        }
        String projectName = requiredText(document.get("projectName"), "Project name");
        if (projectName.length() > 150) {
            throw new IllegalArgumentException("Project name is too long.");
        }

        double duration = requiredNumber(document.get("duration"), "Duration");
        double musicStart = requiredNumber(document.get("musicStart"), "Music start");
        double musicEnd = requiredNumber(document.get("musicEnd"), "Music end");
        if (duration <= 0 || musicStart < 0 || musicEnd <= musicStart
                || musicEnd > duration + 0.01) {
            throw new IllegalArgumentException("Invalid music time range.");
        }

        if (!(document.get("audio") instanceof Map<?, ?> audio)) {
            throw new IllegalArgumentException("Audio information is missing.");
        }
        String audioPath = requiredText(audio.get("file"), "Audio path");
        if (!audioPath.startsWith("audio/")
                || audioPath.length() <= "audio/".length()
                || audioPath.substring("audio/".length()).contains("/")
                || audioPath.contains("\\")) {
            throw new IllegalArgumentException("Invalid audio path.");
        }
        checkZipPath(audioPath);
        checkAudioExtension(audioPath.substring("audio/".length()));

        if (!(document.get("moments") instanceof List<?> moments)) {
            throw new IllegalArgumentException("Moments must be an array.");
        }
        Set<String> ids = new HashSet<>();
        for (Object item : moments) {
            if (!(item instanceof Map<?, ?> moment)) {
                throw new IllegalArgumentException("Invalid Moment.");
            }
            String id = requiredText(moment.get("id"), "Moment ID");
            requiredText(moment.get("title"), "Moment title");
            if (!ids.add(id)) {
                throw new IllegalArgumentException("Duplicate Moment ID.");
            }
            double start = requiredNumber(moment.get("start"), "Moment start");
            double end = requiredNumber(moment.get("end"), "Moment end");
            if (start < musicStart - 0.01 || end <= start || end > musicEnd + 0.01) {
                throw new IllegalArgumentException("Invalid Moment time range.");
            }
            Object options = moment.get("options");
            if (options != null && !(options instanceof Map<?, ?>)) {
                throw new IllegalArgumentException("Moment options must be an object.");
            }
        }

        return new ProjectMetadata(projectName, audioPath, duration, moments.size());
    }

    private String requiredText(Object value, String field) {
        if (!(value instanceof String text) || text.isBlank()) {
            throw new IllegalArgumentException(field + " is required.");
        }
        return text;
    }

    private double requiredNumber(Object value, String field) {
        if (!(value instanceof Number number) || !Double.isFinite(number.doubleValue())) {
            throw new IllegalArgumentException(field + " must be a valid number.");
        }
        return number.doubleValue();
    }

    private String safeFileName(String original) {
        if (original == null || original.isBlank()) {
            throw new IllegalArgumentException("Audio filename is required.");
        }
        String name = original.replace('\\', '/');
        name = name.substring(name.lastIndexOf('/') + 1);
        name = name.replaceAll("[^\\p{L}\\p{N} ._-]", "_").trim();
        if (name.isBlank() || name.equals(".") || name.equals("..") || name.length() > 150) {
            throw new IllegalArgumentException("Invalid audio filename.");
        }
        return name;
    }

    private String safeFolderName(String projectName) {
        String folder = projectName.trim().replaceAll("[^\\p{L}\\p{N}._-]+", "-");
        folder = folder.replaceAll("^[.-]+|[.-]+$", "");
        return folder.isBlank() ? "synchro-project" : folder;
    }

    private void checkAudioExtension(String filename) {
        int dot = filename.lastIndexOf('.');
        if (dot <= 0 || dot == filename.length() - 1
                || !ALLOWED_AUDIO_EXTENSIONS.contains(
                        filename.substring(dot + 1).toLowerCase(Locale.ROOT))) {
            throw new IllegalArgumentException(
                    "Unsupported audio format. Use MP3, WAV, OGG, M4A, or FLAC.");
        }
    }

    private void checkZipPath(String path) {
        if (path == null || path.isBlank() || path.startsWith("/")
                || path.contains("\\") || path.contains(":") || path.length() > 300) {
            throw new IllegalArgumentException("Invalid ZIP entry path.");
        }
        for (String part : path.split("/", -1)) {
            if (part.equals(".") || part.equals("..")) {
                throw new IllegalArgumentException("Invalid ZIP entry path.");
            }
        }
    }

    private byte[] readLimited(java.io.InputStream input, int limit) throws IOException {
        ByteArrayOutputStream result = new ByteArrayOutputStream();
        byte[] buffer = new byte[8192];
        int read;
        while ((read = input.read(buffer)) != -1) {
            if (result.size() > limit - read) {
                throw new IllegalArgumentException("Uploaded project data is too large.");
            }
            result.write(buffer, 0, read);
        }
        return result.toByteArray();
    }

    private record ProjectMetadata(
            String projectName,
            String audioPath,
            double durationSeconds,
            int momentCount) {
    }
}
