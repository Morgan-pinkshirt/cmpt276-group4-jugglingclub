package com.cmpt276.jugglingclub.models;

import jakarta.persistence.Basic;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Entity
@Table(name = "synchro_projects")
public class SynchroProject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "owner_uid", nullable = false)
    private int ownerUid;

    @Column(name = "project_name", nullable = false)
    private String projectName;

    @Column(name = "audio_file_name")
    private String audioFileName;

    @Column(name = "duration_seconds")
    private Double durationSeconds;

    @Column(name = "moment_count", nullable = false)
    private int momentCount;

    @Basic(fetch = FetchType.LAZY)
    @Column(name = "archive_data", nullable = false, columnDefinition = "bytea")
    private byte[] archiveData;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public SynchroProject() {
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now(ZoneOffset.UTC);
    }

    public Long getId() {
        return id;
    }

    public int getOwnerUid() {
        return ownerUid;
    }

    public void setOwnerUid(int ownerUid) {
        this.ownerUid = ownerUid;
    }

    public String getProjectName() {
        return projectName;
    }

    public void setProjectName(String projectName) {
        this.projectName = projectName;
    }

    public String getAudioFileName() {
        return audioFileName;
    }

    public void setAudioFileName(String audioFileName) {
        this.audioFileName = audioFileName;
    }

    public Double getDurationSeconds() {
        return durationSeconds;
    }

    public void setDurationSeconds(Double durationSeconds) {
        this.durationSeconds = durationSeconds;
    }

    public int getMomentCount() {
        return momentCount;
    }

    public void setMomentCount(int momentCount) {
        this.momentCount = momentCount;
    }

    public byte[] getArchiveData() {
        return archiveData;
    }

    public void setArchiveData(byte[] archiveData) {
        this.archiveData = archiveData;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
