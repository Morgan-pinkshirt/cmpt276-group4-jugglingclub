// import { current, hidding } from './prop.js';
import { canvasBall, canvasMov, canvasPoi, canvasRing, canvasStill } from './moving.js';
import { current, hidding, stillBallSvg, stillPoiSvg, stillRingSvg } from './prop.js';
// Use of AI (one of ChatGPT's solution when I was trying to understand testing) to change the variables that are needed on both moving.js and script.js to window.[name] - November 13th.
// type="module"


const club = document.getElementById("clubBody");
const handle = document.getElementById("clubHandle");
const clubMov = document.getElementById("BodyMov");
const handleMov = document.getElementById("HandleMov");

const slider = document.getElementById("colourSlider");
const bodyButton = document.getElementById("bodyButton");
const handleButton = document.getElementById("handleButton");

// const ballColor = document.getElementById("ball-color");

const svgStill = document.getElementById("svg_still");
const svgMov = document.getElementById("svg_moving");

let selectedPart = "body";
let bodyColour = 0;
let handleColour = 0;


function changeVisibilityColor() {
    svgStill.style.display = "block";
    canvasStill.style.display = "none";
    svgMov.style.display = "block";
    canvasMov.style.display = "none";
    modeName.style.visibility = "hidden";
}

// function toggleColor(current) {
//     let oppositeMode;
//     if (current === canvasStill) {
//             oppositeMode = svgStill;
//     } else if (current === stillBallSvg) {
//             oppositeMode = stillBallSvg;
//     } else if (current === stillRingSvg) {
//             oppositeMode = stillRingSvg;
//     } else if (current === stillPoiSvg) {
//             oppositeMode = stillPoiSvg;
//     } else {
//             oppositeMode = current;
//     }
//     console.log("this is opposite");
//     console.log(oppositeMode);
//     hidding(current, oppositeMode);
// }

function toggleColor(prop) {
    let oppositeMode;
    if (prop === "club") {
        oppositeMode = svgStill;
    } else if (prop === "ball") {
        oppositeMode = stillBallSvg;
    } else if (prop === "ring") {
        oppositeMode = stillRingSvg;
    } else if (prop === "poi") {
        oppositeMode = stillPoiSvg;
    } else {
        oppositeMode = current;
    }
    // console.log("this is opposite");
    // console.log(oppositeMode);
    hidding(current, oppositeMode);
}

bodyButton.addEventListener("click", function () {
    selectedPart = "body";
    slider.value = bodyColour;
    // changeVisibilityColor();
    // hidding(current)
    // toggleColor(current);

    bodyButton.classList.add("active");
    handleButton.classList.remove("active");
});

handleButton.addEventListener("click", function () {
    selectedPart = "handle";
    slider.value = handleColour;
    // changeVisibilityColor();
    // hidding(currentt, )

    handleButton.classList.add("active");
    bodyButton.classList.remove("active");
});

slider.addEventListener("input", function () {
    // changeVisibilityColor();
    const prop = document.getElementById("prop-options").value;
    // hidding(current, newDisplay);
    toggleColor(prop);
    if (prop === "club") {
        changeColor(club, handle);
        changeColor(clubMov, handleMov);
        changeVisibilityColor();
    } else {
        changeColorSingle(document.getElementById(`${prop}-color`));
        console.log(current);
        toggleColor(current);
        // current = newDisplay;
    }

});

// export function changeCurrent(newCurrent) {
//     current = newCurrent;
// }

function changeColor(body, handle) {
    // toggleColor(current);
    let colour = "hsl(" + slider.value + ", 100%, 50%)";
    if (selectedPart === "body") {
        body.setAttribute("fill", colour);
        bodyColour = slider.value;
    } else {
        handle.setAttribute("fill", colour);
        handleColour = slider.value;
    }

}

function changeColorSingle(body) {
    let colour = "hsl(" + slider.value + ", 100%, 50%)";
    body.setAttribute("fill", colour);
    bodyColour = slider.value;
}


function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHSL(hex) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { h: 0, s: 100, l: 50 };
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function saveStateAndRedirect(event, targetUrl) {
    event.preventDefault();
    const bodyHex = hslToHex(parseFloat(typeof bodyColour !== 'undefined' ? bodyColour : 0), 100, 50);
    const handleHex = hslToHex(parseFloat(typeof handleColour !== 'undefined' ? handleColour : 0), 100, 50);

    const rawBrightness = document.getElementById('static-brightness')?.value || document.getElementById('brightness')?.value || '50';
    const rawSaturation = document.getElementById('static-saturation')?.value || document.getElementById('saturation')?.value || '50';
    const brightness3D = (parseFloat(rawBrightness) / 50).toFixed(2); // 50 -> 1.0, 100 -> 2.0
    const saturation3D = (parseFloat(rawSaturation) / 50).toFixed(2);

    const productTypeVal = document.getElementById('propTypeSelector')?.value || document.getElementById('productType')?.value || 'club';

    const currentSelection = {
        UID: document.querySelector('input[name="UID"]')?.value || 'new',
        projectname: document.getElementById('projectname')?.value || document.getElementById('projectName')?.value || 'My Project',
        productType: productTypeVal,
        productColor: bodyHex,
        bodyColor: bodyHex,
        handleColor: handleHex,
        ballColor: productTypeVal === 'ball' ? bodyHex : '',

        brightness: brightness3D,
        saturation: saturation3D,
        
        effect: document.getElementById('options')?.value || document.getElementById('effectSelect')?.value || document.getElementById('effect')?.value || 'none'
    };

    sessionStorage.setItem('tempSelection', JSON.stringify(currentSelection));
    window.location.href = targetUrl;
}

document.addEventListener("DOMContentLoaded", function () {
    const savedTempData = sessionStorage.getItem('tempSelection');
    if (savedTempData) {
        const data = JSON.parse(savedTempData);
        
        const uidInput = document.querySelector('input[name="UID"]');
        if (uidInput && data.UID) uidInput.value = data.UID;

        const projInput = document.getElementById('projectname') || document.getElementById('projectName');
        if (projInput && data.projectname) projInput.value = data.projectname;

        const productTypeEl = document.getElementById('propTypeSelector') || document.getElementById('productType');
        if (productTypeEl && data.productType) {
            productTypeEl.value = data.productType;
            productTypeEl.dispatchEvent(new Event('change'));
        }

        const effectEl = document.getElementById('options') || document.getElementById('effectSelect') || document.getElementById('effect');
        if (effectEl && data.effect) {
            effectEl.value = data.effect;
            effectEl.dispatchEvent(new Event('change'));
        }

        // Scale from 3D (0 - 2) to 2D percentage (0 - 100, where 1.0 -> 50%)
        const briVal = data.brightness !== undefined ? Number(data.brightness) : 1;
        const briPercent = briVal <= 2 ? Math.min(100, Math.max(0, briVal * 50)) : briVal;

        const satVal = data.saturation !== undefined ? Number(data.saturation) : 1;
        const satPercent = satVal <= 2 ? Math.min(100, Math.max(0, satVal * 50)) : satVal;

        // Sync BOTH Static (right) and Rotating (left) sliders in 2D
        ['static-brightness', 'brightness'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.value = briPercent;
                el.dispatchEvent(new Event('input'));
            }
        });

        ['static-saturation', 'saturation'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.value = satPercent;
                el.dispatchEvent(new Event('input'));
            }
        });
    

        const bodyHex = data.bodyColor || data.productColor;
        const handleHex = data.handleColor;

        if (bodyHex && typeof hexToHSL === 'function') {
            const bodyHsl = hexToHSL(bodyHex);
            bodyColour = bodyHsl.h;
            let bodyStr = `hsl(${bodyHsl.h}, ${bodyHsl.s}%, ${bodyHsl.l}%)`;
            if (typeof club !== 'undefined' && club) club.setAttribute("fill", bodyStr);
            if (typeof clubMov !== 'undefined' && clubMov) clubMov.setAttribute("fill", bodyStr);
        }

        if (handleHex && typeof hexToHSL === 'function') {
            const handleHsl = hexToHSL(handleHex);
            handleColour = handleHsl.h;
            let handleStr = `hsl(${handleHsl.h}, ${handleHsl.s}%, ${handleHsl.l}%)`;
            if (typeof handle !== 'undefined' && handle) handle.setAttribute("fill", handleStr);
            if (typeof handleMov !== 'undefined' && handleMov) handleMov.setAttribute("fill", handleStr);
        }

        if (typeof slider !== 'undefined' && slider) {
            slider.value = (typeof selectedPart !== 'undefined' && selectedPart === 'handle') ? handleColour : bodyColour;
        }

        sessionStorage.removeItem('tempSelection');
        console.log("Restored temporary selection successfully in 2D:", data);
    }
});

if (typeof bodyButton !== 'undefined' && bodyButton) {
    bodyButton.classList.add("active");
}

export { svgStill, svgMov, handleButton, bodyButton };