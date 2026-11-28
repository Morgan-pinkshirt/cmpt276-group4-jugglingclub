console.log("found this script!");
console.log("product color = " + document.getElementById("productcolor").value);
console.log("body color =" + document.getElementById("bodycolor").value);
console.log("product type =" + document.getElementById("producttype").value);
console.log("effect = " +document.getElementById("effect").value )
const canvasStill = document.getElementById("canvas_still");
const ctxStill = canvasStill.getContext('2d');
const img = document.getElementById("img");

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

function numberTen(mode) {
    if (mode[4] != "_") {
        modeName.innerHTML += mode[4];
        return 6;
    }
    return 5
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

// TODO: 

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


// TODO animtation ripped form moving.js: make them work:

let angleMov = 0;
let angleStill = 0;

const centerX = 101.5;
const centerY = 443;

function drawClub(ctx, angle, type) {
    const img = document.getElementById("img");
    ctx.save();

    ctx.beginPath();
    ctx.fillStyle = "rgb(231, 231, 250)";
    ctx.fillRect(87, 113, 20, 7);
	ctx.moveTo(90, 120);
	ctx.lineTo(90, 223);
	ctx.lineTo(103, 323);
	ctx.lineTo(103, 120);
	ctx.moveTo(90, 230);

	ctx.bezierCurveTo(55, 290, 70, 350, 83, 365);
	ctx.lineTo(100, 365);
	ctx.bezierCurveTo(115, 350, 130, 290, 103, 230);
    ctx.closePath();
    ctx.clip();

    ctx.setTransform(1,0,0,1,0,0);
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    ctx.translate(-centerX, -centerY);	

    // To  wait for the image to load: https://stackoverflow.com/questions/42515769/how-to-wait-for-loading-images-in-canvas
    if (img.complete) {
        ctx.drawImage(img, -230, 120);
    }
    ctx.restore();

    // Increase angle for next frame
    if (type == "moving") {
        angle += 0.01 * (window.jestersSpeed ?? 1);
    } else if (type == "still") {
        angle += 0.0075;
    }

    if (angle > Math.PI * 2) {
        angle = 0;
        // counter = 0;
    }
    
    // Request next animation frame
    // ChatGPT November 7th, 2026, "How can I pass the variable ctx = canvas.getContext('2d') as a parameter of my draw function". Solve the issue of not being able to pass the variable ctx as a paramter, or getting it flagged as an infinite loop. I used it for the requestAnimationFrame
    requestAnimationFrame(() => drawClub(ctx, angle, type));
}

function drawBall(ctx, angle) {
    const img = document.getElementById("img");
    ctx.save();
    ctx.beginPath();
    // To draw a circle https://www.w3schools.com/graphics/canvas_circles.asp
    ctx.arc(85, 200, 60, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.clip();

    ctx.setTransform(1,0,0,1,0,0);
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    ctx.translate(-centerX, -centerY);	

    if (img.complete) {
        ctx.drawImage(img, -230, 120);
    }
    ctx.restore();
    // Increase angle for next frame
    angle += 0.0075;
    if (angle > Math.PI * 2) {
        angle = 0;
        // counter = 0;
    }
    // Request next animation frame
    requestAnimationFrame(() => drawBall(ctx, angle));
}

function drawRing(ctx, angle) {
    const img = document.getElementById("img");
    ctx.save();
    ctx.beginPath();
    // To draw a ring. https://www.youtube.com/watch?v=gLtKs3sTHso
    ctx.arc(85, 200, 85, 0, Math.PI * 2);
    ctx.arc(85, 200, 65, 0, Math.PI * 2);
    ctx.closePath(); 
    ctx.clip("evenodd");

    ctx.setTransform(1,0,0,1,0,0);
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    ctx.translate(-centerX, -centerY);	

    if (img.complete) {
        ctx.drawImage(img, -230, 120);
    }
    ctx.restore();
    // Increase angle for next frame
    angle += 0.0075;
    if (angle > Math.PI * 2) {
        angle = 0;
        // counter = 0;
    }
    // Request next animation frame
    requestAnimationFrame(() => drawRing(ctx, angle));
}

function drawPoi(ctx, angle) {
    const img = document.getElementById("img");
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(85, 100);
    ctx.lineTo(85, 350);
    ctx.lineWidth = 5;
    ctx.strokeStyle = "grey";
    ctx.stroke();
    ctx.closePath();
    ctx.arc(85, 350, 45, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.clip();

    ctx.setTransform(1,0,0,1,0,0);
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    ctx.translate(-centerX, -centerY);	

    if (img.complete) {
        ctx.drawImage(img, -230, 120);
    }
    ctx.restore();
    // Increase angle for next frame
    angle += 0.0075;
    if (angle > Math.PI * 2) {
        angle = 0;
        // counter = 0;
    }
    // Request next animation frame
    requestAnimationFrame(() => drawPoi(ctx, angle));
}

function drawStaff(ctx, angle) {
    const img = document.getElementById("img");
    ctx.save();
    ctx.beginPath();
    ctx.arc(75, 70, 25, 0, 2 * Math.PI);
    ctx.fillRect(70, 95, 10, 200);
    ctx.arc(75, 320, 25, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.clip();

    ctx.setTransform(1,0,0,1,0,0);
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    ctx.translate(-centerX, -centerY);	

    if (img.complete) {
        ctx.drawImage(img, -230, 120);
    }
    ctx.restore();
    // Increase angle for next frame
    angle += 0.0075;
    if (angle > Math.PI * 2) {
        angle = 0;
        // counter = 0;
    }
    // Request next animation frame
    requestAnimationFrame(() => drawStaff(ctx, angle));
}

// Start animation
drawClub(ctxStill, angleStill, "still");
drawBall(ctxBall, angleStill);
drawRing(ctxRing, angleStill);
drawPoi(ctxPoi, angleStill);
drawStaff(ctxStaff, angleStill);