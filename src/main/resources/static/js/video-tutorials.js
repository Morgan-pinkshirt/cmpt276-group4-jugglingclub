(() => {
    "use strict";

    const $ = (id) => document.getElementById(id);

    const uploadDialog = $("uploadDialog");
    const uploadForm = $("uploadVideoForm");

    const videoTitle = $("videoTitle");
    const videoDescription = $("videoDescription");
    const videoFile = $("videoFile");

    const selectedFileInfo = $("selectedFileInfo");
    const selectedFileName = $("selectedFileName");
    const selectedFileSize = $("selectedFileSize");

    const uploadError = $("uploadError");
    const uploadProgress = $("uploadProgress");
    const uploadProgressLabel = $("uploadProgressLabel");
    const uploadProgressPercentage = $("uploadProgressPercentage");
    const uploadProgressBar = $("uploadProgressBar");

    const submitUpload = $("submitUpload");
    const cancelUpload = $("cancelUpload");
    const closeUploadDialog = $("closeUploadDialog");
    const removeSelectedFile = $("removeSelectedFile");

    const deleteDialog = $("deleteDialog");
    const deleteVideoTitle = $("deleteVideoTitle");
    const deleteError = $("deleteError");

    const confirmDelete = $("confirmDelete");
    const cancelDelete = $("cancelDelete");
    const closeDeleteDialog = $("closeDeleteDialog");

    const pageMessage = $("pageMessage");

    const filePicker = document.querySelector(
        ".tutorial-file-picker"
    );

    const csrfToken = document.querySelector(
        'meta[name="_csrf"]'
    )?.content;

    const csrfHeader = document.querySelector(
        'meta[name="_csrf_header"]'
    )?.content;

    const canUpload =
        document.body.dataset.canUpload === "true";

    const canDelete =
        document.body.dataset.canDelete === "true";

    const maxVideoSize =
        Number(uploadForm?.dataset.maxSize)
        || 100 * 1024 * 1024;

    const MESSAGE_STORAGE_KEY =
        "jugglingclub.video-tutorials.message";

    let uploading = false;
    let deleting = false;
    let selectedVideoId = null;

    function formatFileSize(bytes) {
        const size = Number(bytes);

        if (!Number.isFinite(size) || size < 0) {
            return "Unknown";
        }

        if (size === 0) {
            return "0 B";
        }

        const units = ["B", "KB", "MB", "GB"];

        const index = Math.min(
            Math.floor(Math.log(size) / Math.log(1024)),
            units.length - 1
        );

        const value = size / Math.pow(1024, index);

        return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
    }

    function formatUploadDate(value) {
        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "Unknown";
        }

        return new Intl.DateTimeFormat("en-CA", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }).format(date);
    }

    function formatMetadata() {
        document.querySelectorAll(
            "[data-file-size]"
        ).forEach((element) => {
            element.textContent = formatFileSize(
                element.dataset.bytes
            );
        });

        document.querySelectorAll(
            "[data-upload-date]"
        ).forEach((element) => {
            element.textContent = formatUploadDate(
                element.getAttribute("datetime")
            );
        });
    }

    function showMessage(element, message, type = "error") {
        if (!element) {
            return;
        }

        element.classList.remove(
            "tutorial-message-error",
            "tutorial-message-success"
        );

        element.classList.add(
            type === "success"
                ? "tutorial-message-success"
                : "tutorial-message-error"
        );

        element.textContent = message;
        element.hidden = false;
    }

    function hideMessage(element) {
        if (!element) {
            return;
        }

        element.textContent = "";
        element.hidden = true;
    }

    function storePageMessage(message) {
        try {
            sessionStorage.setItem(
                MESSAGE_STORAGE_KEY,
                message
            );
        } catch {
        }
    }

    function restorePageMessage() {
        try {
            const message = sessionStorage.getItem(
                MESSAGE_STORAGE_KEY
            );

            if (!message) {
                return;
            }

            sessionStorage.removeItem(
                MESSAGE_STORAGE_KEY
            );

            showMessage(
                pageMessage,
                message,
                "success"
            );
        } catch {
        }
    }

    function parseJsonResponse(text) {
        try {
            return JSON.parse(text);
        } catch {
            return null;
        }
    }

    function getErrorMessage(status, response) {
        if (typeof response?.message === "string"
            && response.message.trim()) {

            return response.message;
        }

        switch (status) {
            case 400:
                return "Please check the submitted information.";

            case 401:
                return "Your session has expired. Please log in again.";

            case 403:
                return "You do not have permission to perform this action.";

            case 404:
                return "The requested video could not be found.";

            case 413:
                return `The video cannot exceed ${formatFileSize(maxVideoSize)}.`;

            case 415:
                return "Only valid MP4 video files are supported.";

            case 429:
                return "Too many requests. Please try again later.";

            default:
                return "The request could not be completed. Please try again.";
        }
    }

    function validateVideoFile(file) {
        if (!file) {
            return "Please select a video file.";
        }

        if (file.size === 0) {
            return "The selected video file is empty.";
        }

        if (!file.name.toLowerCase().endsWith(".mp4")) {
            return "Only MP4 video files are supported.";
        }

        if (file.type.toLowerCase() !== "video/mp4") {
            return "The selected file must have the video/mp4 content type.";
        }

        if (file.size > maxVideoSize) {
            return `The video cannot exceed ${formatFileSize(maxVideoSize)}.`;
        }

        return null;
    }

    function clearSelectedFile() {
        if (videoFile) {
            videoFile.value = "";
        }

        if (selectedFileName) {
            selectedFileName.textContent = "";
        }

        if (selectedFileSize) {
            selectedFileSize.textContent = "";
        }

        if (selectedFileInfo) {
            selectedFileInfo.hidden = true;
        }
    }

    function updateSelectedFile() {
        hideMessage(uploadError);

        const file = videoFile?.files?.[0];

        if (!file) {
            clearSelectedFile();
            return;
        }

        const error = validateVideoFile(file);

        if (error) {
            clearSelectedFile();
            showMessage(uploadError, error);
            return;
        }

        selectedFileName.textContent = file.name;

        selectedFileSize.textContent =
            formatFileSize(file.size);

        selectedFileInfo.hidden = false;
    }

    function resetUploadProgress() {
        if (!uploadProgress) {
            return;
        }

        uploadProgress.hidden = true;

        uploadProgressBar.value = 0;

        uploadProgressPercentage.textContent = "0%";

        uploadProgressLabel.textContent =
            "Uploading video...";
    }

    function updateUploadProgress(value) {
        const percentage = Math.max(
            0,
            Math.min(100, Math.round(value))
        );

        uploadProgress.hidden = false;

        uploadProgressBar.value = percentage;

        uploadProgressPercentage.textContent =
            `${percentage}%`;

        uploadProgressLabel.textContent =
            percentage === 100
                ? "Processing and saving video..."
                : "Uploading video...";
    }

    function setUploadBusy(value) {
        uploading = value;

        [
            videoTitle,
            videoDescription,
            videoFile,
            submitUpload,
            cancelUpload,
            closeUploadDialog,
            removeSelectedFile
        ].forEach((element) => {
            if (element) {
                element.disabled = value;
            }
        });

        if (submitUpload) {
            submitUpload.textContent = value
                ? "Uploading..."
                : "Upload Video";
        }

        if (uploadForm) {
            uploadForm.setAttribute(
                "aria-busy",
                String(value)
            );
        }
    }

    function resetUploadForm() {
        uploadForm?.reset();

        clearSelectedFile();

        resetUploadProgress();

        hideMessage(uploadError);
    }

    function openUploadModal() {
        if (!canUpload
            || !uploadDialog
            || uploading
            || uploadDialog.open) {

            return;
        }

        resetUploadForm();

        uploadDialog.showModal();

        videoTitle?.focus();
    }

    function closeUploadModal() {
        if (!uploadDialog || uploading) {
            return;
        }

        uploadDialog.close();

        resetUploadForm();
    }

    function uploadVideo(event) {
        event.preventDefault();

        if (!canUpload || uploading) {
            return;
        }

        hideMessage(uploadError);

        const title = videoTitle.value.trim();

        const description =
            videoDescription.value.trim();

        const file = videoFile.files?.[0];

        if (!title) {
            showMessage(
                uploadError,
                "Video title is required."
            );

            videoTitle.focus();
            return;
        }

        if (title.length > 150) {
            showMessage(
                uploadError,
                "Video title cannot exceed 150 characters."
            );
            return;
        }

        if (description.length > 2000) {
            showMessage(
                uploadError,
                "Video description cannot exceed 2000 characters."
            );
            return;
        }

        const fileError = validateVideoFile(file);

        if (fileError) {
            showMessage(uploadError, fileError);
            return;
        }

        const formData = new FormData(uploadForm);

        formData.set("title", title);

        formData.set("description", description);

        formData.set("file", file, file.name);

        const xhr = new XMLHttpRequest();

        xhr.open(
            "POST",
            uploadForm.action,
            true
        );

        xhr.setRequestHeader(
            "Accept",
            "application/json"
        );

        if (csrfToken && csrfHeader) {
            xhr.setRequestHeader(
                csrfHeader,
                csrfToken
            );
        }

        xhr.timeout = 300000;

        xhr.upload.addEventListener(
            "progress",
            (event) => {
                if (event.lengthComputable) {
                    updateUploadProgress(
                        event.loaded / event.total * 100
                    );
                }
            }
        );

        xhr.upload.addEventListener(
            "load",
            () => {
                updateUploadProgress(100);
            }
        );

        xhr.addEventListener("load", () => {
            const response = parseJsonResponse(
                xhr.responseText
            );

            if (xhr.status >= 200
                && xhr.status < 300
                && response?.success === true) {

                updateUploadProgress(100);

                storePageMessage(
                    response.message
                    || "Video uploaded successfully."
                );

                window.location.reload();
                return;
            }

            setUploadBusy(false);

            resetUploadProgress();

            showMessage(
                uploadError,
                getErrorMessage(
                    xhr.status,
                    response
                )
            );
        });

        xhr.addEventListener("error", () => {
            setUploadBusy(false);

            resetUploadProgress();

            showMessage(
                uploadError,
                "A network error occurred. Refresh the video list before retrying."
            );
        });

        xhr.addEventListener("timeout", () => {
            setUploadBusy(false);

            resetUploadProgress();

            showMessage(
                uploadError,
                "The upload request timed out. Check the video list before retrying."
            );
        });

        xhr.addEventListener("abort", () => {
            setUploadBusy(false);

            resetUploadProgress();

            showMessage(
                uploadError,
                "The upload was cancelled."
            );
        });

        setUploadBusy(true);

        updateUploadProgress(0);

        try {
            xhr.send(formData);
        } catch {
            setUploadBusy(false);

            resetUploadProgress();

            showMessage(
                uploadError,
                "Unable to start the upload."
            );
        }
    }

    function initializeFilePicker() {
        if (!filePicker || !videoFile) {
            return;
        }

        videoFile.addEventListener(
            "change",
            updateSelectedFile
        );

        removeSelectedFile?.addEventListener(
            "click",
            () => {
                if (uploading) {
                    return;
                }

                clearSelectedFile();

                hideMessage(uploadError);
            }
        );

        filePicker.addEventListener(
            "dragover",
            (event) => {
                event.preventDefault();

                if (uploading) {
                    event.dataTransfer.dropEffect = "none";
                    return;
                }

                event.dataTransfer.dropEffect = "copy";

                filePicker.classList.add(
                    "is-drag-over"
                );
            }
        );

        filePicker.addEventListener(
            "dragleave",
            () => {
                filePicker.classList.remove(
                    "is-drag-over"
                );
            }
        );

        filePicker.addEventListener(
            "drop",
            (event) => {
                event.preventDefault();

                filePicker.classList.remove(
                    "is-drag-over"
                );

                if (uploading) {
                    return;
                }

                hideMessage(uploadError);

                const files = event.dataTransfer.files;

                if (files.length !== 1) {
                    showMessage(
                        uploadError,
                        "Please select one MP4 video at a time."
                    );
                    return;
                }

                const file = files[0];

                const error = validateVideoFile(file);

                if (error) {
                    clearSelectedFile();

                    showMessage(uploadError, error);
                    return;
                }

                try {
                    const transfer = new DataTransfer();

                    transfer.items.add(file);

                    videoFile.files = transfer.files;

                    updateSelectedFile();
                } catch {
                    showMessage(
                        uploadError,
                        "Please use the file selection button."
                    );
                }
            }
        );
    }

    function initializeUpload() {
        if (!canUpload
            || !uploadDialog
            || !uploadForm) {

            return;
        }

        $("openUploadDialog")?.addEventListener(
            "click",
            openUploadModal
        );

        document.querySelectorAll(
            "[data-open-upload]"
        ).forEach((button) => {
            button.addEventListener(
                "click",
                openUploadModal
            );
        });

        closeUploadDialog?.addEventListener(
            "click",
            closeUploadModal
        );

        cancelUpload?.addEventListener(
            "click",
            closeUploadModal
        );

        uploadDialog.addEventListener(
            "cancel",
            (event) => {
                event.preventDefault();

                closeUploadModal();
            }
        );

        uploadForm.addEventListener(
            "submit",
            uploadVideo
        );

        initializeFilePicker();
    }

    function setDeleteBusy(value) {
        deleting = value;

        [
            confirmDelete,
            cancelDelete,
            closeDeleteDialog
        ].forEach((element) => {
            if (element) {
                element.disabled = value;
            }
        });

        if (confirmDelete) {
            confirmDelete.textContent = value
                ? "Deleting..."
                : "Delete Video";
        }

        deleteDialog?.setAttribute(
            "aria-busy",
            String(value)
        );
    }

    function openDeleteModal(videoId, title) {
        if (!canDelete
            || !deleteDialog
            || deleting
            || deleteDialog.open) {

            return;
        }

        const id = String(videoId);

        if (!/^[1-9]\d*$/.test(id)) {
            showMessage(
                pageMessage,
                "Invalid video ID."
            );
            return;
        }

        selectedVideoId = id;

        deleteVideoTitle.textContent =
            title || "Untitled Video";

        hideMessage(deleteError);

        deleteDialog.showModal();

        cancelDelete?.focus();
    }

    function closeDeleteModal() {
        if (!deleteDialog || deleting) {
            return;
        }

        deleteDialog.close();

        selectedVideoId = null;

        deleteVideoTitle.textContent = "";

        hideMessage(deleteError);
    }

    async function deleteVideo() {
        if (!canDelete
            || deleting
            || selectedVideoId === null) {

            return;
        }

        hideMessage(deleteError);

        setDeleteBusy(true);

        const headers = {
            Accept: "application/json"
        };

        if (csrfToken && csrfHeader) {
            headers[csrfHeader] = csrfToken;
        }

        try {
            const response = await fetch(
                `/api/tutorials/${encodeURIComponent(selectedVideoId)}`,
                {
                    method: "DELETE",
                    credentials: "same-origin",
                    headers
                }
            );

            const result = parseJsonResponse(
                await response.text()
            );

            if (!response.ok
                || result?.success !== true) {

                showMessage(
                    deleteError,
                    getErrorMessage(
                        response.status,
                        result
                    )
                );

                return;
            }

            storePageMessage(
                result.message
                || "Video deleted successfully."
            );

            window.location.reload();

        } catch {
            showMessage(
                deleteError,
                "A network error occurred. Refresh the video list to verify the deletion."
            );

        } finally {
            setDeleteBusy(false);
        }
    }

    function initializeDelete() {
        if (!canDelete || !deleteDialog) {
            return;
        }

        document.querySelectorAll(
            "[data-delete-video]"
        ).forEach((button) => {
            button.addEventListener(
                "click",
                () => {
                    openDeleteModal(
                        button.dataset.videoId,
                        button.dataset.videoTitle
                    );
                }
            );
        });

        cancelDelete?.addEventListener(
            "click",
            closeDeleteModal
        );

        closeDeleteDialog?.addEventListener(
            "click",
            closeDeleteModal
        );

        confirmDelete?.addEventListener(
            "click",
            deleteVideo
        );

        deleteDialog.addEventListener(
            "cancel",
            (event) => {
                event.preventDefault();

                closeDeleteModal();
            }
        );
    }

    function initializeVideoPlayers() {
        const videos = Array.from(
            document.querySelectorAll(
                ".tutorial-video"
            )
        );

        videos.forEach((video) => {
            video.addEventListener(
                "play",
                () => {
                    videos.forEach((otherVideo) => {
                        if (otherVideo !== video
                            && !otherVideo.paused) {

                            otherVideo.pause();
                        }
                    });
                }
            );

            video.addEventListener(
                "error",
                () => {
                    showMessage(
                        pageMessage,
                        "This video could not be played. The file may be unavailable or use an unsupported codec."
                    );
                }
            );
        });
    }

    function initialize() {
        formatMetadata();

        restorePageMessage();

        initializeUpload();

        initializeDelete();

        initializeVideoPlayers();
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initialize
        );
    } else {
        initialize();
    }
})();
