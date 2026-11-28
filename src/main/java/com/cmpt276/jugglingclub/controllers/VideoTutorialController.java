package com.cmpt276.jugglingclub.controllers;

import com.cmpt276.jugglingclub.models.VideoTutorialRepository.VideoSummary;
import com.cmpt276.jugglingclub.models.user;
import com.cmpt276.jugglingclub.models.usersRepository;
import com.cmpt276.jugglingclub.services.VideoTutorialService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Controller
public class VideoTutorialController {

    private static final int STREAM_CHUNK_SIZE =
            1024 * 1024;

    private static final MediaType VIDEO_TYPE =
            MediaType.parseMediaType("video/mp4");

    private static final Pattern RANGE_PATTERN =
            Pattern.compile("bytes=(\\d*)-(\\d*)");

    private final VideoTutorialService videoService;

    private final usersRepository userRepository;

    public VideoTutorialController(
            VideoTutorialService videoService,
            usersRepository userRepository) {

        this.videoService = videoService;
        this.userRepository = userRepository;
    }

    private user getCurrentUser(HttpServletRequest request) {

        HttpSession session = request.getSession(false);

        if (session == null) {
            return null;
        }

        Object sessionValue = session.getAttribute("user");

        if (!(sessionValue instanceof user)) {
            return null;
        }

        user sessionUser = (user) sessionValue;

        user currentUser = userRepository
                .findById(sessionUser.getUid())
                .orElse(null);

        if (currentUser == null) {

            session.invalidate();

            return null;
        }

        return currentUser;
    }

    private String getTheme(user currentUser) {

        String theme = currentUser.getTheme();

        if ("light".equals(theme)
                || "dark".equals(theme)
                || "purple".equals(theme)) {

            return theme;
        }

        return "purple";
    }

    private void populatePageModel(
            Model model,
            user currentUser,
            List<VideoSummary> videos) {

        model.addAttribute(
                "videos",
                videos
        );

        model.addAttribute(
                "role",
                currentUser.getRole().name()
        );

        model.addAttribute(
                "theme",
                getTheme(currentUser)
        );

        model.addAttribute(
                "username",
                currentUser.getName()
        );

        model.addAttribute(
                "canUpload",
                videoService.canUpload(currentUser)
        );

        model.addAttribute(
                "canDelete",
                videoService.canDelete(currentUser)
        );

        model.addAttribute(
                "maxVideoSize",
                VideoTutorialService.MAX_VIDEO_SIZE
        );
    }

    @GetMapping("/tutorials")
    public String viewTutorials(
            HttpServletRequest request,
            Model model) {

        user currentUser = getCurrentUser(request);

        if (currentUser == null) {
            return "redirect:/userlogin";
        }

        List<VideoSummary> videos =
                videoService.getAllVideos(currentUser);

        populatePageModel(
                model,
                currentUser,
                videos
        );

        return "tutorials/videos";
    }

    @GetMapping("/admin/tutorials")
    public String manageTutorials(
            HttpServletRequest request,
            Model model) {

        user currentUser = getCurrentUser(request);

        if (currentUser == null) {
            return "redirect:/userlogin";
        }

        if (!videoService.canUpload(currentUser)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Access denied."
            );
        }

        List<VideoSummary> videos =
                videoService.getAllVideos(currentUser);

        populatePageModel(
                model,
                currentUser,
                videos
        );

        return "tutorials/manage";
    }

    @GetMapping(
            value = "/api/tutorials",
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<List<VideoSummary>> getVideos(
            HttpServletRequest request) {

        user currentUser = getCurrentUser(request);

        List<VideoSummary> videos =
                videoService.getAllVideos(currentUser);

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(videos);
    }

    @PostMapping(
            value = "/api/tutorials/upload",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<Map<String, Object>> uploadVideo(
            HttpServletRequest request,
            @RequestParam("title") String title,
            @RequestParam(
                    value = "description",
                    required = false
            ) String description,
            @RequestParam("file") MultipartFile file) {

        user currentUser = getCurrentUser(request);

        Long videoId = videoService.uploadVideo(
                currentUser,
                title,
                description,
                file
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .cacheControl(CacheControl.noStore())
                .body(Map.of(
                        "success", true,
                        "message", "Video uploaded successfully.",
                        "videoId", videoId
                ));
    }

    @DeleteMapping(
            value = "/api/tutorials/{id}",
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<Map<String, Object>> deleteVideo(
            HttpServletRequest request,
            @PathVariable("id") Long videoId) {

        user currentUser = getCurrentUser(request);

        videoService.deleteVideo(
                currentUser,
                videoId
        );

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(Map.of(
                        "success", true,
                        "message", "Video deleted successfully."
                ));
    }

    @GetMapping(
            value = "/api/tutorials/{id}/stream",
            produces = "video/mp4"
    )
    public ResponseEntity<StreamingResponseBody> streamVideo(
            HttpServletRequest request,
            @PathVariable("id") Long videoId,
            @RequestHeader(
                    value = HttpHeaders.RANGE,
                    required = false
            ) String rangeHeader) {

        user currentUser = getCurrentUser(request);

        VideoSummary video = videoService.getVideo(
                currentUser,
                videoId
        );

        long totalSize = video.getFileSize();

        if (totalSize <= 0) {

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Video data is unavailable."
            );
        }

        HttpHeaders headers = new HttpHeaders();

        headers.setContentType(VIDEO_TYPE);

        headers.set(
                HttpHeaders.ACCEPT_RANGES,
                "bytes"
        );

        headers.set(
                HttpHeaders.CONTENT_DISPOSITION,
                "inline"
        );

        headers.set(
                "X-Content-Type-Options",
                "nosniff"
        );

        headers.setCacheControl(
                CacheControl.noStore()
        );

        if (rangeHeader == null
                || rangeHeader.isBlank()
                || !rangeHeader.startsWith("bytes=")
                || rangeHeader.contains(",")) {

            headers.setContentLength(totalSize);

            StreamingResponseBody body =
                    createVideoStream(
                            currentUser,
                            videoId,
                            0,
                            totalSize - 1
                    );

            return new ResponseEntity<>(
                    body,
                    headers,
                    HttpStatus.OK
            );
        }

        VideoRange range;

        try {

            range = parseRange(
                    rangeHeader,
                    totalSize
            );

        } catch (IllegalArgumentException exception) {

            headers.set(
                    HttpHeaders.CONTENT_RANGE,
                    "bytes */" + totalSize
            );

            headers.setContentLength(0);

            return new ResponseEntity<>(
                    null,
                    headers,
                    HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE
            );
        }

        headers.set(
                HttpHeaders.CONTENT_RANGE,
                "bytes "
                        + range.start()
                        + "-"
                        + range.end()
                        + "/"
                        + totalSize
        );

        headers.setContentLength(
                range.end() - range.start() + 1
        );

        StreamingResponseBody body =
                createVideoStream(
                        currentUser,
                        videoId,
                        range.start(),
                        range.end()
                );

        return new ResponseEntity<>(
                body,
                headers,
                HttpStatus.PARTIAL_CONTENT
        );
    }

    private StreamingResponseBody createVideoStream(
            user currentUser,
            Long videoId,
            long start,
            long end) {

        return outputStream -> {

            long position = start;

            while (position <= end) {

                long chunkEnd = Math.min(
                        end,
                        position + STREAM_CHUNK_SIZE - 1
                );

                byte[] chunk = videoService.getVideoRange(
                        currentUser,
                        videoId,
                        position,
                        chunkEnd
                );

                long expectedLength =
                        chunkEnd - position + 1;

                if (chunk == null
                        || chunk.length != expectedLength) {

                    throw new IOException(
                            "Unable to read the requested video data."
                    );
                }

                outputStream.write(chunk);

                position = chunkEnd + 1;
            }

            outputStream.flush();
        };
    }

    private VideoRange parseRange(
            String rangeHeader,
            long totalSize) {

        Matcher matcher =
                RANGE_PATTERN.matcher(
                        rangeHeader.trim()
                );

        if (!matcher.matches()) {

            throw new IllegalArgumentException(
                    "Invalid byte range."
            );
        }

        String startValue = matcher.group(1);

        String endValue = matcher.group(2);

        if (startValue.isEmpty()
                && endValue.isEmpty()) {

            throw new IllegalArgumentException(
                    "Empty byte range."
            );
        }

        long start;

        long end;

        if (startValue.isEmpty()) {

            long suffixLength =
                    Long.parseLong(endValue);

            if (suffixLength <= 0) {

                throw new IllegalArgumentException(
                        "Invalid suffix range."
                );
            }

            start = Math.max(
                    0,
                    totalSize - suffixLength
            );

            end = totalSize - 1;

        } else {

            start = Long.parseLong(startValue);

            if (start >= totalSize) {

                throw new IllegalArgumentException(
                        "Range exceeds video size."
                );
            }

            end = endValue.isEmpty()

                    ? totalSize - 1

                    : Math.min(
                            Long.parseLong(endValue),
                            totalSize - 1
                    );
        }

        if (start < 0 || end < start) {

            throw new IllegalArgumentException(
                    "Invalid byte range."
            );
        }

        return new VideoRange(
                start,
                end
        );
    }

    private record VideoRange(
            long start,
            long end) {
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleRequestError(
            ResponseStatusException exception) {

        String message = exception.getReason();

        if (message == null || message.isBlank()) {

            message = "The request could not be completed.";
        }

        return ResponseEntity
                .status(exception.getStatusCode())
                .cacheControl(CacheControl.noStore())
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of(
                        "success", false,
                        "message", message
                ));
    }
}

