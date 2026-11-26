package com.cmpt276.jugglingclub.controllers;

import com.cmpt276.jugglingclub.models.SynchroProject;
import com.cmpt276.jugglingclub.models.SynchroProjectRepository;
import com.cmpt276.jugglingclub.models.user;
import com.cmpt276.jugglingclub.roles.RoleService;
import com.cmpt276.jugglingclub.services.SynchroProjectService;
import com.cmpt276.jugglingclub.services.SynchroProjectService.ProjectArchive;

import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.net.URI;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/synchro-projects")
public class SynchroProjectController {

    private final SynchroProjectRepository repository;
    private final SynchroProjectService service;
    private final RoleService roleService;

    public SynchroProjectController(SynchroProjectRepository repository,
                                    SynchroProjectService service,
                                    RoleService roleService) {
        this.repository = repository;
        this.service = service;
        this.roleService = roleService;
    }

    public record ProjectSummary(
            Long id,
            String projectName,
            String projectType,
            String audioFileName,
            Double durationSeconds,
            int momentCount,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {
    }

    @GetMapping
    public ResponseEntity<?> listProjects(HttpSession session) {
        user currentUser = getCurrentUser(session);
        if (currentUser == null) {
            return unauthorized();
        }

        List<ProjectSummary> projects = repository
                .findAllByOwnerUidOrderByCreatedAtDesc(currentUser.getUid())
                .stream()
                .map(this::toSummary)
                .toList();
        return ResponseEntity.ok(projects);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createProject(
            @RequestParam("projectJson") String projectJson,
            @RequestParam("audioFile") MultipartFile audioFile,
            HttpSession session) throws IOException {

        user currentUser = getCurrentUser(session);
        if (currentUser == null) {
            return unauthorized();
        }
        if (audioFile.getSize() > SynchroProjectService.MAX_ARCHIVE_BYTES) {
            return fileTooLarge();
        }

        ProjectArchive archive = service.createArchive(projectJson, audioFile);
        SynchroProject project = new SynchroProject();
        project.setOwnerUid(currentUser.getUid());
        applyArchive(project, archive);
        project = repository.save(project);

        return ResponseEntity
                .created(URI.create("/api/synchro-projects/" + project.getId()))
                .body(toSummary(project));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProject(@PathVariable Long id, HttpSession session) {
        user currentUser = getCurrentUser(session);
        if (currentUser == null) {
            return unauthorized();
        }
        SynchroProject project = findOwnedProject(id, currentUser);
        if (project == null) {
            return notFound();
        }
        return ResponseEntity.ok(toSummary(project));
    }

    @GetMapping("/{id}/project")
    public ResponseEntity<?> getProjectJson(@PathVariable Long id,
                                            HttpSession session) throws IOException {
        user currentUser = getCurrentUser(session);
        if (currentUser == null) {
            return unauthorized();
        }
        SynchroProject project = findOwnedProject(id, currentUser);
        if (project == null) {
            return notFound();
        }

        ProjectArchive archive = service.readArchive(project.getArchiveData());
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .contentType(MediaType.APPLICATION_JSON)
                .body(archive.projectJson());
    }

    @GetMapping("/{id}/audio")
    public ResponseEntity<?> getProjectAudio(@PathVariable Long id,
                                             HttpSession session) throws IOException {
        user currentUser = getCurrentUser(session);
        if (currentUser == null) {
            return unauthorized();
        }
        SynchroProject project = findOwnedProject(id, currentUser);
        if (project == null) {
            return notFound();
        }

        ProjectArchive archive = service.readArchive(project.getArchiveData());
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .contentType(audioMediaType(archive.audioFileName()))
                .body(archive.audioData());
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateProject(
            @PathVariable Long id,
            @RequestParam("projectJson") String projectJson,
            @RequestParam("audioFile") MultipartFile audioFile,
            HttpSession session) throws IOException {

        user currentUser = getCurrentUser(session);
        if (currentUser == null) {
            return unauthorized();
        }
        SynchroProject project = findOwnedProject(id, currentUser);
        if (project == null) {
            return notFound();
        }
        if (audioFile.getSize() > SynchroProjectService.MAX_ARCHIVE_BYTES) {
            return fileTooLarge();
        }

        ProjectArchive archive = service.createArchive(projectJson, audioFile);
        applyArchive(project, archive);
        repository.save(project);
        return ResponseEntity.ok(toSummary(project));
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> importProject(
            @RequestParam("file") MultipartFile file,
            HttpSession session) throws IOException {

        user currentUser = getCurrentUser(session);
        if (currentUser == null) {
            return unauthorized();
        }
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Please select a ZIP file.");
        }
        if (file.getSize() > SynchroProjectService.MAX_ARCHIVE_BYTES) {
            return fileTooLarge();
        }
        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase(java.util.Locale.ROOT).endsWith(".zip")) {
            throw new IllegalArgumentException("Please select a ZIP file.");
        }

        ProjectArchive archive = service.readArchive(file.getBytes());
        SynchroProject project = new SynchroProject();
        project.setOwnerUid(currentUser.getUid());
        applyArchive(project, archive);
        project = repository.save(project);

        return ResponseEntity
                .created(URI.create("/api/synchro-projects/" + project.getId()))
                .body(toSummary(project));
    }

    @PostMapping(value = "/export-draft", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> exportDraft(
            @RequestParam("projectJson") String projectJson,
            @RequestParam("audioFile") MultipartFile audioFile,
            HttpSession session) throws IOException {

        user currentUser = getCurrentUser(session);
        if (currentUser == null) {
            return unauthorized();
        }
        if (audioFile.getSize() > SynchroProjectService.MAX_ARCHIVE_BYTES) {
            return fileTooLarge();
        }

        ProjectArchive archive = service.createArchive(projectJson, audioFile);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .contentType(MediaType.parseMediaType("application/zip"))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"synchro-project.zip\"")
                .body(archive.archiveData());
    }

    @GetMapping("/{id}/export")
    public ResponseEntity<?> exportProject(@PathVariable Long id, HttpSession session) {
        user currentUser = getCurrentUser(session);
        if (currentUser == null) {
            return unauthorized();
        }
        SynchroProject project = findOwnedProject(id, currentUser);
        if (project == null) {
            return notFound();
        }

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .contentType(MediaType.parseMediaType("application/zip"))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"synchro-project-" + id + ".zip\"")
                .body(project.getArchiveData());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProject(@PathVariable Long id, HttpSession session) {
        user currentUser = getCurrentUser(session);
        if (currentUser == null) {
            return unauthorized();
        }
        SynchroProject project = findOwnedProject(id, currentUser);
        if (project == null) {
            return notFound();
        }

        repository.delete(project);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleInvalidProject(IllegalArgumentException exception) {
        return ResponseEntity.badRequest().body(Map.of("error", exception.getMessage()));
    }

    @ExceptionHandler(IOException.class)
    public ResponseEntity<Map<String, String>> handleUnreadableProject(IOException exception) {
        return ResponseEntity.badRequest()
                .body(Map.of("error", "The project file could not be processed."));
    }

    private void applyArchive(SynchroProject project, ProjectArchive archive) {
        project.setProjectName(archive.projectName());
        project.setAudioFileName(archive.audioFileName());
        project.setDurationSeconds(archive.durationSeconds());
        project.setMomentCount(archive.momentCount());
        project.setArchiveData(archive.archiveData());
    }

    private ProjectSummary toSummary(SynchroProject project) {
        return new ProjectSummary(
                project.getId(),
                project.getProjectName(),
                "Synchro",
                project.getAudioFileName(),
                project.getDurationSeconds(),
                project.getMomentCount(),
                project.getCreatedAt(),
                project.getUpdatedAt());
    }

    private SynchroProject findOwnedProject(Long id, user currentUser) {
        return repository.findByIdAndOwnerUid(id, currentUser.getUid()).orElse(null);
    }

    private user getCurrentUser(HttpSession session) {
        if (!roleService.isLoggedIn(session)) {
            return null;
        }
        Object sessionUser = session.getAttribute("user");
        return sessionUser instanceof user currentUser ? currentUser : null;
    }

    private MediaType audioMediaType(String filename) {
        int dot = filename.lastIndexOf('.');
        String extension = dot < 0 ? "" : filename.substring(dot + 1)
                .toLowerCase(java.util.Locale.ROOT);
        return switch (extension) {
            case "mp3" -> MediaType.parseMediaType("audio/mpeg");
            case "wav" -> MediaType.parseMediaType("audio/wav");
            case "ogg" -> MediaType.parseMediaType("audio/ogg");
            case "m4a" -> MediaType.parseMediaType("audio/mp4");
            case "flac" -> MediaType.parseMediaType("audio/flac");
            default -> MediaType.APPLICATION_OCTET_STREAM;
        };
    }

    private ResponseEntity<Map<String, String>> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Please log in."));
    }

    private ResponseEntity<Map<String, String>> notFound() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "Project not found."));
    }

    private ResponseEntity<Map<String, String>> fileTooLarge() {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(Map.of("error", "The project file exceeds the 25 MB limit."));
    }
}



