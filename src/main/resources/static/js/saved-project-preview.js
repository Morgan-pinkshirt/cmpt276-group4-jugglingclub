(() => {
    "use strict";

    const SVG_NS = "http://www.w3.org/2000/svg";

    function createSvgElement(tag, attributes) {
        const element = document.createElementNS(SVG_NS, tag);

        for (const [name, value] of Object.entries(attributes)) {
            element.setAttribute(name, String(value));
        }

        return element;
    }

    function getColor(value, fallback) {
        if (!value) {
            return fallback;
        }

        const color = String(value).trim();

        if (/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(color)) {
            if (color.toLowerCase() === "#000000" ||
                color.toLowerCase() === "#000") {
                return "#ffffff";
            }

            return color;
        }

        if (/^#[0-9a-fA-F]{8}$/.test(color)) {
            return color;
        }

        if (/^rgb(a)?\(\s*[\d.,%\s]+\)$/.test(color)) {
            return color;
        }

        if (/^[a-zA-Z]+$/.test(color)) {
            return color;
        }

        return fallback;
    }

    function getFilterValue(value) {
        if (value === null || value === undefined || value === "") {
            return 1;
        }

        const raw = String(value).trim();
        const number = Number(raw.replace("%", ""));

        if (!Number.isFinite(number) || number < 0) {
            return 1;
        }

        if (raw.endsWith("%") || number > 2) {
            return Math.min(number / 100, 2);
        }

        return Math.min(number, 2);
    }

    function createClub(bodyColor, handleColor) {
        const svg = createSvgElement("svg", {
            viewBox: "0 0 120 300",
            width: "80",
            height: "105",
            "aria-hidden": "true"
        });

        svg.appendChild(createSvgElement("path", {
            d: "M60 20 C20 20 25 100 50 160 L70 160 C95 100 100 20 60 20",
            fill: bodyColor
        }));

        svg.appendChild(createSvgElement("rect", {
            x: 50,
            y: 160,
            width: 20,
            height: 110,
            fill: handleColor
        }));

        svg.appendChild(createSvgElement("rect", {
            x: 47,
            y: 265,
            width: 26,
            height: 15,
            rx: 15,
            fill: "black"
        }));

        return svg;
    }

    function createBall(color) {
        const svg = createSvgElement("svg", {
            viewBox: "0 0 170 300",
            width: "95",
            height: "105",
            "aria-hidden": "true"
        });

        svg.appendChild(createSvgElement("circle", {
            r: 60,
            cx: 83,
            cy: 140,
            fill: color
        }));

        return svg;
    }

    function createRing(color) {
        const svg = createSvgElement("svg", {
            viewBox: "0 0 250 300",
            width: "95",
            height: "105",
            "aria-hidden": "true"
        });

        svg.appendChild(createSvgElement("circle", {
            r: 87.5,
            cx: 120,
            cy: 140,
            fill: "none",
            stroke: color,
            "stroke-width": 25
        }));

        return svg;
    }

    function createPoi(color) {
        const svg = createSvgElement("svg", {
            viewBox: "0 0 150 300",
            width: "95",
            height: "105",
            "aria-hidden": "true"
        });

        svg.appendChild(createSvgElement("circle", {
            r: 30,
            cx: 50,
            cy: 250,
            fill: color
        }));

        svg.appendChild(createSvgElement("line", {
            x1: 50,
            x2: 50,
            y1: 220,
            y2: 100,
            stroke: "currentColor",
            "stroke-width": 4
        }));

        return svg;
    }

    function renderPreview(container) {
        const data = container.dataset;

        const type = (data.productType || "club")
            .trim()
            .toLowerCase();

        const bodyColor = getColor(
            data.bodyColor || data.productColor,
            "grey"
        );

        const productColor = getColor(
            data.productColor || data.bodyColor,
            "white"
        );

        const brightness = getFilterValue(data.brightness);
        const saturation = getFilterValue(data.saturation);

        let svg;

        switch (type) {
            case "club":
                svg = createClub(bodyColor, productColor);
                break;

            case "ball":
                svg = createBall(productColor);
                break;

            case "ring":
                svg = createRing(productColor);
                break;

            case "poi":
                svg = createPoi(productColor);
                break;

            default:
                return;
        }
        
        svg.style.filter =
            `brightness(${brightness}) saturate(${saturation})`;

        container.replaceChildren(svg);
    }

    function initializePreviews() {
        const previews = document.querySelectorAll(
            ".saved-project-preview"
        );

        previews.forEach(container => {
            try {
                renderPreview(container);
            } catch (error) {
                console.error("Saved project preview failed:", error);
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializePreviews,
            { once: true }
        );
    } else {
        initializePreviews();
    }
})();
