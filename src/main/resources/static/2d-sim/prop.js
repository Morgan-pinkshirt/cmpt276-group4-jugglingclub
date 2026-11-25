// To share use a function and variable defined in the script in another script: https://www.w3schools.com/js/js_modules_export.asp

import { svgStill, svgMov, handleButton, bodyButton, bodyButton2, svgMovPoi, svgMovStaffBall, svgMovStaffCylinder } from './script.js';
import { canvasBall, canvasMov, canvasPoi, canvasRing, canvasStill, staffButton, staffOption } from './moving.js';

const changeColor = document.getElementById("change-color");
const clubPart = document.getElementById("club-part");
const movingSection = document.getElementById("moving");
// const handleBtn = document.getElementById("handleButton");
// const moving

const propBtn = document.getElementById("prop-button");

// window.stillClubSvg = document.getElementById("svg_still");

const staticDiv = document.getElementById("static-transform");
const stillBallSvg = document.getElementById("ball_still");
const stillRingSvg = document.getElementById("ring_still");
const stillPoiSvg = document.getElementById("poi_still");
const stillStaffBallSvg = document.getElementById("staff_still_ball");
const stillStaffCylinderSvg = document.getElementById("staff_still_cylinder");

const staffExtraOption = document.getElementById("checkboxDiv");
const staffEndColor = document.getElementById("dependently");
const staffShape = document.getElementById("staff-shape");


// const stillBallSvg = document.createElement("svg");
// stillBallSvg.id = "ball-still";
// stillBallSvg.width = "120";
// stillBallSvg.height = "300";
// stillBallSvg.viewBox = "0 0 120 300";
// const ball = document.createElement("circle");
// // ball.id="ball-still";
// ball.r="45";
// ball.cx="50";
// ball.cy="50";
// ball.fill="grey";
// stillBallSvg.appendChild(ball);
// staticDiv.appendChild(stillBallSvg);

let current = svgStill;
let currentMov = svgStill;

function hidding(currentDisplay, newDisplay, moving = false) {
    currentDisplay.style.display = "none";
    newDisplay.style.display = "block";
    if (moving) {
        currentMov = newDisplay;
        return;
    }
    current = newDisplay;
}

// function propPart(prop, body, handle) {
//     if (prop === "club") {
//         body.innerHTML = "Club Body";
//     }
// }

function hideClub() {
    canvasMov.style.display = "none";
    svgMov.style.display = "none";
}

propBtn.addEventListener('click', function () {
    const prop = document.getElementById("prop-options").value;
    if (prop === "club") {
        movingSection.style.display = "block";
        // handleButton.style.display = "block";
        // bodyButton.style.display = "block";
        changeColor.style.visibility = "visible";
        clubPart.innerHTML = "Club Parts";
        bodyButton.innerHTML = "Club Body";
        
        // // window.svgStill.style.display = "block";
        // window.canvasStill.style.display = "block";
        // window.stillBallSvg.style.display="none";
        hidding(currentMov, svgMov, true);
        hidding(current, svgStill);
        // current = window.canvasStill;
    }
    else {
        // svgStill.style.display = "none";
        movingSection.style.display = "none";
        changeColor.style.visibility = "hidden";
        // handleButton.style.display = "none";
        // bodyButton.style.display = "none";
    }
    if (prop !== "staff") {
        staffExtraOption.style.display = "none";
        staffShape.style.display = "none";
    }
    if (prop === "ball") {
        console.log("juggling balls");
        // window.svgStill.style.display = "none";
        // window.canvasStill.style.display = "none";
        // window.stillBallSvg.style.display="block";
        hidding(current, stillBallSvg);
        // current = window.stillBallSvg;
    } else if (prop === "poi") {
        movingSection.style.display = "block";
        hideClub();
        hidding(currentMov, svgMovPoi, true);
        hidding(current, stillPoiSvg);
        // current = stillPoiSvg;

    } else if (prop === "ring") {
        console.log("ring");
        hidding(current, stillRingSvg);
        // current = window.stillRingSvg;
    } else if (prop === "staff") {
        movingSection.style.display = "block";
        hideClub();
        // handleButton.style.display = "block";
        // bodyButton.style.display = "block";
        staffShape.style.display = "block";
        staffExtraOption.style.display = "block";
        changeColor.style.visibility = "visible";
        clubPart.innerHTML = "Staff Parts";
        bodyButton.innerHTML = "Top End";
        console.log("staff");
        const staffOption = document.getElementById("staff-option").value;
        // if (staffOption.value === "ball") {
            hidding(currentMov, svgMovStaffBall, true);
            hidding(current, stillStaffBallSvg);
        // } else {
        //     hidding(currentMov, svgMovStaffCylinder, true);
        //     hidding(current, stillStaffCylinderSvg);
        // }

    }
});

// function extraButton() {
staffEndColor.addEventListener('click', function () {
    if (staffEndColor.checked) {
        bodyButton2.style.display = "none";
    } else {
        bodyButton2.style.display = "block";
    }
})

export { current, currentMov, hidding, stillBallSvg, stillPoiSvg, stillRingSvg, svgStill, stillStaffBallSvg, stillStaffCylinderSvg, staffEndColor };