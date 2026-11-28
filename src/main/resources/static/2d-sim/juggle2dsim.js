console.log("found this script!");
console.log("product color = " + document.getElementById("productcolor").value);
console.log("body color =" + document.getElementById("bodycolor").value);
console.log("product type =" + document.getElementById("producttype").value);
console.log("effect = " +document.getElementById("effect").value )
const canvasStill = document.getElementById("canvas_still");
const ctxStill = canvasStill.getContext('2d');

const canvasBall = document.getElementById("canvas_ball");
const ctxBall = canvasBall.getContext('2d');

const canvasRing = document.getElementById("canvas_ring");
const ctxRing = canvasRing.getContext('2d');

const canvasPoi = document.getElementById("canvas_poi");
const ctxPoi = canvasPoi.getContext('2d');

const canvasStaff = document.getElementById("canvas_staff");
const ctxStaff = canvasStaff.getContext('2d');

const svgStill = document.getElementById("svg_still");

let current = svgStill;

function hidding(currentDisplay, newDisplay) {
    currentDisplay.style.display = "none";
    newDisplay.style.display = "block";
    current = newDisplay;
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
function changeColor(body, handle) {
    // toggleColor(current);
    
    if (selectedPart === "body") {
        colour = hexToHSL(document.getElementById("bodycolor").value);

        body.setAttribute("fill", colour);
      
    } else {
        colour = hexToHSL(document.getElementById("productcolor").value);
        handle.setAttribute("fill", colour);
      
    }

}

function changeColorSingle(body) {
    let colour = hexToHSL(document.getElementById("bodycolor").value);;
    body.setAttribute("fill", colour);
    bodyColour = slider.value;
}

function changeColorStaff(knob1, knob2, handle) {
    // toggleColor(current);
        let colour;
    if (selectedPart === "body") {
        colour = hexToHSL(document.getElementById("bodycolor").value);
        knob1.setAttribute("fill", colour);
        knob2.setAttribute("fill", colour);
        
    } else {
        colour = hexToHSL(document.getElementById("productcolor").value);
        handle.setAttribute("fill", colour);
    }

}

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
    } else if (prop === "staff") {
        oppositeMode = stillStaffSvg;
    } else {
        oppositeMode = current;
    }
    // console.log("this is opposite");
    // console.log(oppositeMode);
    hidding(current, oppositeMode);
}

function setcolor(){
    const prop = document.getElementById("prop-options").value;
    // hidding(current, newDisplay);
    toggleColor(prop);
    if (prop === "club") {
        changeColor(club, handle);
        changeColor(clubMov, handleMov);
        changeVisibilityColor();
    } else if (prop === "staff") {
        changeColorStaff(document.getElementById(`staff-top`), document.getElementById(`staff-bottom`), document.getElementById(`staff-handle`));
        console.log(current);
        toggleColor(current);
        // current = newDisplay;
    } else {
        changeColorSingle(document.getElementById(`${prop}-color1`));
        changeColorSingle(document.getElementById(`${prop}-color2`));
        changeColorSingle(document.getElementById(`${prop}-color3`));
        console.log(current);
        toggleColor(current);
        // current = newDisplay;
    }
    if(document.getElementById("effect").value !== "none"){

    }
}



function applyeffect(){
    const mode = document.getElementById("options").value;
    const prop = document.getElementById("producttype").value;
    mode.value = document.getElementById("effect").value;
    let i = 5;
    if (mode[1] == 1 && mode[2] != 3) {
        modeName.innerHTML = `Page 1 - #${mode[3]}`;
        i = numberTen(mode);
    } else if (mode[1] == 2) {
        modeName.innerHTML = `Page 2 - #${mode[3]}`;
        i = numberTen(mode);
    } else if (mode[1] == 3) {
        modeName.innerHTML = `Page 3 - #${mode[3]}`;
        i = numberTen(mode);
    } else if (mode[1] == 1 && mode[2] == 3) {

        modeName.innerHTML = `Page 13 - #${mode[4]}`;
        if (mode[5] != "_") {
            i = 6;
            modeName.innerHTML += mode[5];
            i = 7;
        }
    }
    modeName.innerHTML += ` - ${mode[i].toUpperCase()}`;
    i++;
    while (i < mode.length) {
        if (mode[i] == "_") {
            modeName.innerHTML += ` ${mode[i+1].toUpperCase()}`;
            i++;
        // } else if (mode[i] == "-") {
        //     modeName.innerHTML += "/";
        } else {
            modeName.innerHTML += mode[i]; 
        }
        i++;
    }
	img.src=`img/${mode}.png`;
    // angle = 0;

    if (prop === "club") {
        hidding(svgStill, canvasStill);
        svgMov.style.display = "none";
        canvasMov.style.display = "block";
        // window.svgStill.style.display = "none";
        canvasStill.style.display = "block";
        canvasStaff.style.display = "none";
        canvasPoi.style.display = "none";
        // window.modeName.style.visibility = "visible";
    } else if (prop === "ball") {
        hidding(stillBallSvg, canvasBall);
        canvasRing.style.display = "none";
        // window.stillBallSvg.style.display = "none";
        canvasPoi.style.display = "none";
        canvasStaff.style.display = "none";
        canvasBall.style.display = "block";
    } else if (prop === "ring") {
        hidding(stillRingSvg, canvasRing);
        // window.stillRingSvg.style.display = "none";
        canvasBall.style.display = "none";
        canvasPoi.style.display = "none";
        canvasStaff.style.display = "none";
        canvasRing.style.display = "block";
    } else if (prop === "poi") {
        hidding(stillPoiSvg, canvasPoi);
        canvasRing.style.display = "none";
        canvasBall.style.display = "none";
        canvasStaff.style.display = "none";
        // window.stillPoiSvg.style.display = "none";
        canvasPoi.style.display = "block";
    } else if (prop === "staff") {
        hidding(stillStaffSvg, canvasStaff);
        canvasRing.style.display = "none";
        canvasBall.style.display = "none";
        canvasPoi.style.display = "none";
        // window.stillPoiSvg.style.display = "none";
        canvasStaff.style.display = "block";
    }
};
