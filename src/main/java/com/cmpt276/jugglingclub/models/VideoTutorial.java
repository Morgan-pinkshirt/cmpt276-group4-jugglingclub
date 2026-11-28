package com.cmpt276.jugglingclub.models;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "video_tutorials")
public class VideoTutorial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 2000)
    private String description;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "content_type", nullable = false, length = 50)
    private String contentType = "video/mp4";

    @Column(name = "file_size", nullable = false)
    private long fileSize;

    @Column(name = "video_data", nullable = false,
            columnDefinition = "BYTEA")
    private byte[] videoData;

    @Column(name = "uploaded_by", nullable = false)
    private Integer uploadedBy;

    @Column(name = "created_at", nullable = false,
            updatable = false)
    private Instant createdAt;

    public VideoTutorial() {
    }

    public VideoTutorial(
            String title,
            String description,
            String fileName,
            byte[] videoData,
            Integer uploadedBy) {

        this.title = title;
        this.description = description;
        this.fileName = fileName;
        this.contentType = "video/mp4";
        this.videoData = videoData;
        this.fileSize = videoData.length;
        this.uploadedBy = uploadedBy;
    }

    @PrePersist
    protected void onCreate() {

        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getContentType() {
        return contentType;
    }

    public long getFileSize() {
        return fileSize;
    }

    public byte[] getVideoData() {
        return videoData;
    }

    public void setVideoData(byte[] videoData) {

        this.videoData = videoData;

        this.fileSize = videoData == null
                ? 0
                : videoData.length;
    }

    public Integer getUploadedBy() {
        return uploadedBy;
    }

    public void setUploadedBy(Integer uploadedBy) {
        this.uploadedBy = uploadedBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

