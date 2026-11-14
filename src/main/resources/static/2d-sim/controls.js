document.addEventListener("DOMContentLoaded", function () {
    
    const resetButton =
        document.getElementById("reset-simulator");
    const movingClub =
        document.getElementById("clubDivision");
    const staticClub =
        document.getElementById("static-transform");
    const bodyButton =
        document.getElementById("bodyButton");
    const handleButton =
        document.getElementById("handleButton");
    const colourSlider =
        document.getElementById("colorSlider");
    const effectSelector =
        document.getElementById("options");

    const MIN_ZOOM = 75;
    const MAX_ZOOM = 125;
    const ZOOM_STEP = 25;
    let movingZoom = 100;
    let staticZoom = 100;

    const movingZoomOut =
        document.getElementById("moving-zoom-out");
    const movingZoomIn =
        document.getElementById("moving-zoom-in");
    const movingZoomValue =
        document.getElementById("moving-zoom-value");
    const staticZoomOut =
        document.getElementById("static-zoom-out");
    const staticZoomIn =
        document.getElementById("static-zoom-in");
    const staticZoomValue =
        document.getElementById("static-zoom-value");

    function updateMovingZoom() {
        movingClub.style.setProperty(
            "--preview-zoom",
            movingZoom / 100
        );
        movingZoomValue.textContent =
            movingZoom + "%";
        movingZoomOut.disabled =
            movingZoom <= MIN_ZOOM;
        movingZoomIn.disabled =
            movingZoom >= MAX_ZOOM;
    }

    function updateStaticZoom() {
        staticClub.style.setProperty(
            "--preview-zoom",
            staticZoom / 100
        );
        staticZoomValue.textContent =
            staticZoom + "%";
        staticZoomOut.disabled =
            staticZoom <= MIN_ZOOM;
        staticZoomIn.disabled =
            staticZoom >= MAX_ZOOM;
    }

    movingZoomOut.addEventListener("click", function () {
        movingZoom = Math.max(
            MIN_ZOOM,
            movingZoom - ZOOM_STEP
        );
        updateMovingZoom();
    });

    movingZoomIn.addEventListener("click", function () {
        movingZoom = Math.min(
            MAX_ZOOM,
            movingZoom + ZOOM_STEP
        );
        updateMovingZoom();
    });

    staticZoomOut.addEventListener("click", function () {
        staticZoom = Math.max(
            MIN_ZOOM,
            staticZoom - ZOOM_STEP
        );
        updateStaticZoom();
    });

    staticZoomIn.addEventListener("click", function () {
        staticZoom = Math.min(
            MAX_ZOOM,
            staticZoom + ZOOM_STEP
        );
        updateStaticZoom();
    });

    let staticAngle = 0;
    const rotateLeft =
        document.getElementById("static-rotate-left");
    const rotateRight =
        document.getElementById("static-rotate-right");
    const resetOrientation =
        document.getElementById(
            "static-reset-orientation"
        );

    function updateStaticOrientation() {
        staticClub.style.setProperty(
            "--static-angle",
            staticAngle + "deg"
        );
    }

    rotateLeft.addEventListener("click", function () {
        staticAngle = (staticAngle - 90 + 360) % 360;
        updateStaticOrientation();
    });

    rotateRight.addEventListener("click", function () {
        staticAngle = (staticAngle + 90) % 360;
        updateStaticOrientation();
    });

    resetOrientation.addEventListener("click", function () {
        staticAngle = 0;
        updateStaticOrientation();
    });

    function resetSlider(id, value) {
        const slider = document.getElementById(id);
        if (!slider) {
            return;
        }
        slider.value = value;
        slider.dispatchEvent(
            new Event("input", {
                bubbles: true
            })
        );
    }

    function resetSimulator() {
        if (typeof selectedPart !== "undefined") {
            selectedPart = "body";
        }
        if (typeof bodyColour !== "undefined") {
            bodyColour = "#FFFFFF";
        }
        if (typeof handleColour !== "undefined") {
            handleColour = "#FFFFFF";
        }
        bodyButton.classList.add("active");
        handleButton.classList.remove("active");
        colourSlider.value = "#FFFFFF";

        document.getElementById("clubBody")
            .setAttribute("fill", "grey");
        document.getElementById("clubHandle")
            .setAttribute("fill", "white");
        document.getElementById("BodyMov")
            .setAttribute("fill", "grey");
        document.getElementById("HandleMov")
            .setAttribute("fill", "white");

        effectSelector.value = "p1_1_rainbow";
        const modeName =
            document.getElementById("mode_name");
        modeName.textContent =
            "Page 1 - #1 - Rainbow";
        modeName.style.visibility = "hidden";

        document.getElementById("svg_moving")
            .style.display = "block";
        document.getElementById("svg_still")
            .style.display = "block";
        document.getElementById("canvas_moving")
            .style.display = "none";
        document.getElementById("canvas_still")
            .style.display = "none";

        resetSlider("moving-brightness", 100);
        resetSlider("moving-saturation", 100);
        resetSlider("static-brightness", 100);
        resetSlider("static-saturation", 100);
        resetSlider("moving-speed", 100);

        movingZoom = 100;
        staticZoom = 100;
        staticAngle = 0;
        updateMovingZoom();
        updateStaticZoom();
        updateStaticOrientation();
    }

    resetButton.addEventListener(
        "click",
        resetSimulator
    );

    updateMovingZoom();
    updateStaticZoom();
    updateStaticOrientation();
});
