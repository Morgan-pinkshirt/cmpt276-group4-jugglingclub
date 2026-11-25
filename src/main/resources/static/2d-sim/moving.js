// https://zetcode.com/canvas-api/rotate/. 31/10/26
// Use of AI (one of ChatGPT's solution when I was trying to understand testing) to change the variables that are needed on both moving.js and script.js to window.[name] - November 13th.
import { current, currentMov, hidding, stillBallSvg, stillPoiSvg, stillRingSvg, stillStaffBallSvg, stillStaffCylinderSvg } from './prop.js';
import { svgStill, svgMov, svgMovPoi, svgMovStaffBall, svgMovStaffCylinder } from './script.js';

const canvasMov = document.getElementById('canvas_moving');
const ctxMov = canvasMov.getContext('2d');

const canvasStill = document.getElementById("canvas_still");
const ctxStill = canvasStill.getContext('2d');

const canvasBall = document.getElementById("canvas_ball");
const ctxBall = canvasBall.getContext('2d');

const canvasRing = document.getElementById("canvas_ring");
const ctxRing = canvasRing.getContext('2d');

const canvasPoi = document.getElementById("canvas_poi");
const ctxPoi = canvasPoi.getContext('2d');

const canvasPoiMov = document.getElementById("canvas_poi_moving");
const ctxPoiMov = canvasPoiMov.getContext('2d');

const canvasStaffBall = document.getElementById("canvas_staff_ball");
const ctxStaffBall = canvasStaffBall.getContext('2d');

const canvasStaffCylinder = document.getElementById("canvas_staff_cylinder");
const ctxStaffCylinder = canvasStaffCylinder.getContext('2d');

const canvasStaffBallMov = document.getElementById("canvas_staff_ball_moving");
const ctxStaffBallMov = canvasStaffBallMov.getContext('2d');

const canvasStaffCylinderMov = document.getElementById("canvas_staff_cylinder_moving");
const ctxStaffCylinderMov = canvasStaffCylinderMov.getContext('2d');

const clickedButton = document.getElementById("view-button");
const staffButton = document.getElementById("staff-button");
const staffOption = document.getElementById("staff-option").value;

window.modeName = document.getElementById("mode_name");

let shape;

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

function drawStaffBall(ctx, angle) {
    const img = document.getElementById("img");
    ctx.save();
    ctx.beginPath();
    ctx.arc(75, 70, 25, 0, 2 * Math.PI);
    ctx.rect(70, 95, 10, 200);
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
    requestAnimationFrame(() => drawStaffBall(ctx, angle));
}

function drawStaffCylinder(ctx, angle) {
    const img = document.getElementById("img");
    ctx.save();
    ctx.beginPath();
    ctx.rect(62, 45, 25, 50);
    ctx.rect(70, 95, 10, 200);
    ctx.rect(62, 290, 25, 50);
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
    requestAnimationFrame(() => drawStaffCylinder(ctx, angle));
}

// Start animation
drawClub(ctxMov, angleMov, "moving");
drawClub(ctxStill, angleStill, "still");
drawBall(ctxBall, angleStill);
drawRing(ctxRing, angleStill);
drawPoi(ctxPoi, angleStill);
drawPoi(ctxPoiMov, angleMov);
drawStaffBall(ctxStaffBall, angleStill);
drawStaffBall(ctxStaffBallMov, angleMov);
drawStaffCylinder(ctxStaffCylinder, angleStill);
drawStaffCylinder(ctxStaffCylinderMov, angleMov);

function numberTen(mode) {
    if (mode[4] != "_") {
        modeName.innerHTML += mode[4];
        return 6;
    }
    return 5
}

function changeStaff(current, shape) {
    // if (shape === "ball") {
    //     hidding(stillStaffBallSvg, canvasStaffBall);
    //     canvasStaffBall.style.display = "block";
    // } else {
    //     hidding(stillStaffCylinderSvg, canvasStaffCylinder);
    //     canvasStaffCylinder.style.display = "block";
    // }

     if (shape === "ball") {
        hidding(currentMov, svgMovStaffBall, true);
        hidding(current, stillStaffBallSvg);
        // canvasStaffBall.style.display = "block";
    } else {
        hidding(currentMov, svgMovStaffCylinder, true);
        hidding(current, stillStaffCylinderSvg);
    }
}

clickedButton.addEventListener('click', function () {
	const mode = document.getElementById("options").value;
    const prop = document.getElementById("prop-options").value;
    const staffOption2 = document.getElementById("staff-option").value;
    let i = 5;
    if(mode == "none"){
        if (prop === "club") {
            svgStill.style.display = "block";
            svgMov.style.display = "block";
        } else if (prop === "poi") {
            svgMov.style.display = "none";
            stillPoiSvg.style.display = "block";
            svgMovPoi.style.display = "block";
        } else if (prop === "staff" && staffOption2 === "ball") {
            svgMov.style.display = "none";
            stillStaffBallSvg.style.display = "block";
            svgMovStaffBall.style.display = "block";
        } else if (prop === "staff" && staffOption2 === "cylinder") {
            svgMov.style.display = "none";
            stillStaffCylinderSvg.style.display = "block";
            svgMovStaffCylinder.style.display = "block";
        }

        canvasStill.style.display = "none";
        canvasMov.style.display = "none";
        canvasPoi.style.display = "none";
        canvasPoiMov.style.display = "none";
        canvasStaffBall.style.display = "none";
        canvasStaffBallMov.style.display = "none";
        canvasStaffCylinder.style.display = "none";
        canvasStaffCylinderMov.style.display = "none";
        modeName.style.visibility = "hidden";
        return;
    }

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
        canvasStaffBall.style.display = "none";
        canvasStaffCylinder.style.display = "none";
        canvasPoi.style.display = "none";
        // window.modeName.style.visibility = "visible";
    } else if (prop === "ball") {
        hidding(stillBallSvg, canvasBall);
        canvasRing.style.display = "none";
        // window.stillBallSvg.style.display = "none";
        canvasPoi.style.display = "none";
        canvasStaffBall.style.display = "none";
        canvasStaffCylinder.style.display = "none";
        canvasBall.style.display = "block";
    } else if (prop === "ring") {
        hidding(stillRingSvg, canvasRing);
        // window.stillRingSvg.style.display = "none";
        canvasBall.style.display = "none";
        canvasPoi.style.display = "none";
        canvasStaffBall.style.display = "none";
        canvasStaffCylinder.style.display = "none";
        canvasRing.style.display = "block";
    } else if (prop === "poi") {
        hidding(currentMov, canvasPoiMov, true);
        hidding(stillPoiSvg, canvasPoi);
        svgMovPoi.style.display = "none";
        canvasRing.style.display = "none";
        canvasBall.style.display = "none";
        canvasStaffBall.style.display = "none";
        canvasStaffCylinder.style.display = "none";
        // window.stillPoiSvg.style.display = "none";
        canvasPoi.style.display = "block";
        canvasPoiMov.style.display = "block";
    } else if (prop === "staff") {
        svgMovStaffBall.style.display = "none";
        svgMovStaffCylinder.style.display = "none";
        // changeStaff(document.getElementById("staff-option").value);
        
        stillStaffBallSvg.style.display = "none";
        stillStaffCylinderSvg.style.display = "none";
        if (staffOption2 === "ball") {
            // stillStaffBallSvg.style.display = "none";
            hidding(currentMov, canvasStaffBallMov, true);
            hidding(current, canvasStaffBall);
            canvasStaffBall.style.display = "block";
        } else {
            hidding(currentMov, canvasStaffCylinderMov, true);
            hidding(current, canvasStaffCylinder);
            canvasStaffCylinder.style.display = "block";
        }
        canvasRing.style.display = "none";
        canvasBall.style.display = "none";
        canvasPoi.style.display = "none";
        // window.stillPoiSvg.style.display = "none";

    }
});

staffButton.addEventListener('click', function () {
    changeStaff(current, document.getElementById("staff-option").value);
})

// export { clickedButton, angleMov, angleStill }
export { canvasBall, canvasMov, canvasPoi, canvasRing, canvasStill, canvasStaffBall, canvasStaffCylinder, staffButton, staffOption }