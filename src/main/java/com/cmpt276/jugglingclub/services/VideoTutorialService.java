package com.cmpt276.jugglingclub.services;

import com.cmpt276.jugglingclub.models.VideoTutorial;
import com.cmpt276.jugglingclub.models.VideoTutorialRepository;
import com.cmpt276.jugglingclub.models.VideoTutorialRepository.VideoSummary;
import com.cmpt276.jugglingclub.models.user;
import com.cmpt276.jugglingclub.roles.Role;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class VideoTutorialService {

    public static final long MAX_VIDEO_SIZE =
            100L * 1024 * 1024;

    private static final int MAX_TITLE_LENGTH = 150;

    private static final int MAX_DESCRIPTION_LENGTH = 2000;

    private static final int MAX_FILENAME_LENGTH = 255;

    private static final String MP4_CONTENT_TYPE = "video/mp4";

    private static final Set<String> MP4_BRANDS = Set.of(
            "isom",
            "iso2",
            "iso3",
            "iso4",
            "iso5",
            "iso6",
            "iso7",
            "iso8",
            "iso9",
            "mp41",
            "mp42",
            "avc1",
            "avc3",
            "hvc1",
            "hev1",
            "M4V ",
            "M4VH",
            "M4VP",
            "dash",
            "msdh",
            "msix",
            "cmfc",
            "cmfs"
    );

    private final VideoTutorialRepository videoRepository;

    public VideoTutorialService(
            VideoTutorialRepository videoRepository) {

        this.videoRepository = videoRepository;
    }

    public boolean canWatch(user currentUser) {

        if (currentUser == null) {
            return false;
        }

        Role role = currentUser.getRole();

        return role == Role.MEMBER
                || role == Role.ADMIN
                || role == Role.SUPER_ADMIN;
    }

    public boolean canUpload(user currentUser) {

        if (currentUser == null) {
            return false;
        }

        Role role = currentUser.getRole();

        return role == Role.ADMIN
                || role == Role.SUPER_ADMIN;
    }

    public boolean canDelete(user currentUser) {

        return currentUser != null
                && currentUser.getRole() == Role.SUPER_ADMIN;
    }

    private void requireLogin(user currentUser) {

        if (currentUser == null) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Login required."
            );
        }
    }

    private void requireWatchPermission(user currentUser) {

        requireLogin(currentUser);

        if (!canWatch(currentUser)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You do not have permission to watch videos."
            );
        }
    }

    private void requireUploadPermission(user currentUser) {

        requireLogin(currentUser);

        if (!canUpload(currentUser)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You do not have permission to upload videos."
            );
        }
    }

    private void requireDeletePermission(user currentUser) {

        requireLogin(currentUser);

        if (!canDelete(currentUser)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only Super Admins can delete videos."
            );
        }
    }

    @Transactional(readOnly = true)
    public List<VideoSummary> getAllVideos(user currentUser) {

        requireWatchPermission(currentUser);

        return videoRepository.findAllVideoSummaries();
    }

    @Transactional(readOnly = true)
    public VideoSummary getVideo(
            user currentUser,
            Long videoId) {

        requireWatchPermission(currentUser);

        validateVideoId(videoId);

        return videoRepository.findVideoSummaryById(videoId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Video tutorial not found."
                ));
    }

    @Transactional
    public Long uploadVideo(
            user currentUser,
            String title,
            String description,
            MultipartFile file) {

        requireUploadPermission(currentUser);

        String validTitle = validateTitle(title);

        String validDescription =
                validateDescription(description);

        String fileName = validateFile(file);

        byte[] videoData;

        try {

            videoData = file.getBytes();

        } catch (IOException exception) {

            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "The uploaded video could not be read.",
                    exception
            );
        }

        if (videoData.length == 0) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "The uploaded video is empty."
            );
        }

        if (videoData.length > MAX_VIDEO_SIZE) {

            throw new ResponseStatusException(
                    HttpStatus.PAYLOAD_TOO_LARGE,
                    "Video size cannot exceed 100 MB."
            );
        }

        if (!isValidMp4(videoData)) {

            throw new ResponseStatusException(
                    HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                    "The uploaded file is not a valid supported MP4 file."
            );
        }

        VideoTutorial video = new VideoTutorial(
                validTitle,
                validDescription,
                fileName,
                videoData,
                currentUser.getUid()
        );

        VideoTutorial savedVideo =
                videoRepository.save(video);

        return savedVideo.getId();
    }

    @Transactional(readOnly = true)
    public byte[] getVideoData(
            user currentUser,
            Long videoId) {

        requireWatchPermission(currentUser);

        validateVideoId(videoId);

        return videoRepository.findVideoDataById(videoId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Video tutorial not found."
                ));
    }

    @Transactional(readOnly = true)
    public byte[] getVideoRange(
            user currentUser,
            Long videoId,
            long start,
            long end) {

        VideoSummary video =
                getVideo(currentUser, videoId);

        long totalSize = video.getFileSize();

        if (start < 0
                || end < start
                || start >= totalSize
                || end >= totalSize) {

            throw new ResponseStatusException(
                    HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE,
                    "Invalid video byte range."
            );
        }

        long length = end - start + 1;

        if (start >= Integer.MAX_VALUE
                || length > Integer.MAX_VALUE) {

            throw new ResponseStatusException(
                    HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE,
                    "Requested video range is too large."
            );
        }

        int databaseStart =
                Math.toIntExact(start + 1);

        int databaseLength =
                Math.toIntExact(length);

        return videoRepository.findVideoDataRange(
                        videoId,
                        databaseStart,
                        databaseLength
                )
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Video tutorial not found."
                ));
    }

    @Transactional
    public void deleteVideo(
            user currentUser,
            Long videoId) {

        requireDeletePermission(currentUser);

        validateVideoId(videoId);

        if (!videoRepository.existsById(videoId)) {

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Video tutorial not found."
            );
        }

        videoRepository.deleteById(videoId);
    }

    private void validateVideoId(Long videoId) {

        if (videoId == null || videoId <= 0) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid video ID."
            );
        }
    }

    private String validateTitle(String title) {

        if (title == null || title.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Video title is required."
            );
        }

        String result = title.trim();

        if (result.length() > MAX_TITLE_LENGTH) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Video title cannot exceed 150 characters."
            );
        }

        return result;
    }

    private String validateDescription(String description) {

        if (description == null || description.isBlank()) {
            return "";
        }

        String result = description.trim();

        if (result.length() > MAX_DESCRIPTION_LENGTH) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Video description cannot exceed 2000 characters."
            );
        }

        return result;
    }

    private String validateFile(MultipartFile file) {

        if (file == null || file.isEmpty()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Please select a video file."
            );
        }

        if (file.getSize() > MAX_VIDEO_SIZE) {

            throw new ResponseStatusException(
                    HttpStatus.PAYLOAD_TOO_LARGE,
                    "Video size cannot exceed 100 MB."
            );
        }

        String originalName =
                file.getOriginalFilename();

        if (originalName == null || originalName.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid video file name."
            );
        }

        String fileName = originalName
                .replace('\\', '/');

        fileName = fileName.substring(
                fileName.lastIndexOf('/') + 1
        ).trim();

        if (fileName.isBlank()
                || fileName.length() > MAX_FILENAME_LENGTH
                || fileName.chars().anyMatch(Character::isISOControl)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid video file name."
            );
        }

        if (!fileName.toLowerCase(Locale.ROOT).endsWith(".mp4")) {

            throw new ResponseStatusException(
                    HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                    "Only MP4 video files are supported."
            );
        }

        String contentType = file.getContentType();

        if (contentType == null
                || !MP4_CONTENT_TYPE.equalsIgnoreCase(contentType)) {

            throw new ResponseStatusException(
                    HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                    "The video content type must be video/mp4."
            );
        }

        return fileName;
    }

    private boolean isValidMp4(byte[] data) {

        if (data == null || data.length < 24) {
            return false;
        }

        ByteBuffer buffer = ByteBuffer.wrap(data);

        boolean hasFileType = false;
        boolean hasMovieBox = false;
        boolean hasMediaData = false;

        int position = 0;

        while (position < data.length) {

            int remaining =
                    data.length - position;

            if (remaining < 8) {
                return false;
            }

            long boxSize = Integer.toUnsignedLong(
                    buffer.getInt(position)
            );

            String boxType = readBoxType(
                    data,
                    position + 4
            );

            int headerSize = 8;

            if (boxSize == 1) {

                if (remaining < 16) {
                    return false;
                }

                boxSize = buffer.getLong(position + 8);

                headerSize = 16;

            } else if (boxSize == 0) {

                boxSize = remaining;
            }

            if (boxSize < headerSize
                    || boxSize > remaining) {

                return false;
            }

            int payloadStart =
                    position + headerSize;

            int payloadLength =
                    (int) boxSize - headerSize;

            if ("ftyp".equals(boxType)) {

                if (hasFileType
                        || !hasSupportedMp4Brand(
                                data,
                                payloadStart,
                                payloadLength
                        )) {

                    return false;
                }

                hasFileType = true;
            }

            if ("moov".equals(boxType)
                    && payloadLength > 0) {

                hasMovieBox = true;
            }

            if ("mdat".equals(boxType)
                    && payloadLength > 0) {

                hasMediaData = true;
            }

            position += (int) boxSize;
        }

        return hasFileType
                && hasMovieBox
                && hasMediaData;
    }

    private boolean hasSupportedMp4Brand(
            byte[] data,
            int start,
            int length) {

        if (length < 8 || (length - 8) % 4 != 0) {
            return false;
        }

        String majorBrand = readBoxType(
                data,
                start
        );

        if (MP4_BRANDS.contains(majorBrand)) {
            return true;
        }

        int end = start + length;

        for (int position = start + 8;
             position < end;
             position += 4) {

            String compatibleBrand =
                    readBoxType(data, position);

            if (MP4_BRANDS.contains(compatibleBrand)) {
                return true;
            }
        }

        return false;
    }

    private String readBoxType(
            byte[] data,
            int position) {

        return new String(
                data,
                position,
                4,
                StandardCharsets.US_ASCII
        );
    }
}
