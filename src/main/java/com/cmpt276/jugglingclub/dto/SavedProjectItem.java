package com.cmpt276.jugglingclub.dto;

import com.cmpt276.jugglingclub.models.SynchroProject;
import com.cmpt276.jugglingclub.models.save;
import java.time.LocalDateTime;
import java.util.Objects;

public class SavedProjectItem {

    private final long id;
    private final String projectType;
    private final String projectName;
    private final String ownerName;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;
    private final String productType;
    private final String productColor;
    private final String bodyColor;
    private final String brightness;
    private final String saturation;
    private final String effect;
    private final String audioFileName;
    private final Double durationSeconds;
    private final Integer momentCount;

    private SavedProjectItem(long id, String projectType, String projectName,
                             String ownerName, LocalDateTime createdAt,
                             LocalDateTime updatedAt, String productType,
                             String productColor, String bodyColor,
                             String brightness, String saturation, String effect,
                             String audioFileName, Double durationSeconds,
                             Integer momentCount) {
        this.id = id;
        this.projectType = projectType;
        this.projectName = projectName;
        this.ownerName = ownerName;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.productType = productType;
        this.productColor = productColor;
        this.bodyColor = bodyColor;
        this.brightness = brightness;
        this.saturation = saturation;
        this.effect = effect;
        this.audioFileName = audioFileName;
        this.durationSeconds = durationSeconds;
        this.momentCount = momentCount;
    }

    public static SavedProjectItem fromProduct(save product) {
        return fromProduct(product, null);
    }

    public static SavedProjectItem fromProduct(save product, LocalDateTime createdAt) {
        Objects.requireNonNull(product, "Product must not be null.");
        return new SavedProjectItem(
                product.getUid(), "Product", product.getProjectname(),
                product.getName(), createdAt, null,
                product.getProductType(), product.getProductColor(),
                product.getBodyColor(), product.getBrightness(),
                product.getSaturation(), product.getEffect(),
                null, null, null);
    }

    public static SavedProjectItem fromSynchro(SynchroProject project) {
        return fromSynchro(project, null);
    }

    public static SavedProjectItem fromSynchro(SynchroProject project, String ownerName) {
        Objects.requireNonNull(project, "Synchro project must not be null.");
        return new SavedProjectItem(
                project.getId(), "Synchro", project.getProjectName(),
                ownerName, project.getCreatedAt(), project.getUpdatedAt(),
                null, null, null, null, null, null,
                project.getAudioFileName(), project.getDurationSeconds(),
                project.getMomentCount());
    }

    public long getId() {
        return id;
    }

    public String getProjectType() {
        return projectType;
    }

    public String getProjectName() {
        return projectName;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public String getProductType() {
        return productType;
    }

    public String getProductColor() {
        return productColor;
    }

    public String getBodyColor() {
        return bodyColor;
    }

    public String getBrightness() {
        return brightness;
    }

    public String getSaturation() {
        return saturation;
    }

    public String getEffect() {
        return effect;
    }

    public String getAudioFileName() {
        return audioFileName;
    }

    public Double getDurationSeconds() {
        return durationSeconds;
    }

    public Integer getMomentCount() {
        return momentCount;
    }

    public String getProjectKey() {
        return projectType.toLowerCase(java.util.Locale.ROOT) + ":" + id;
    }

    public boolean isProduct() {
        return "Product".equals(projectType);
    }

    public boolean isSynchro() {
        return "Synchro".equals(projectType);
    }
}

