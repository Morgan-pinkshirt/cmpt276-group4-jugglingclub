// To share use a function and variable defined in the script in another script: https://www.w3schools.com/js/js_modules_export.asp

// import { current } from './script.js';
const movingSection = document.getElementById("moving");
const handleBtn = document.getElementById("handleButton");
// const moving

const propBtn = document.getElementById("prop-button");
// window.stillClubSvg = document.getElementById("svg_still");

const staticDiv = document.getElementById("static-transform");
window.stillBallSvg = document.getElementById("ball_still");
window.stillRingSvg = document.getElementById("ring_still");
window.stillPoiSvg = document.getElementById("poi_still");

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

let current = window.canvasStill;

function hidding(currentDisplay, newDisplay) {
    currentDisplay.style.display = "none";
    newDisplay.style.display = "block";
    current = newDisplay;
}

propBtn.addEventListener('click', function () {
    const prop = document.getElementById("prop-options").value;
    if (prop === "club") {
        movingSection.style.display = "block";
        handleBtn.style.display = "block";
        // // window.svgStill.style.display = "block";
        // window.canvasStill.style.display = "block";
        // window.stillBallSvg.style.display="none";
        hidding(current, canvasStill);
        // current = window.canvasStill;
    }
    else {
        window.svgStill.style.display = "none";
        movingSection.style.display = "none";
        handleBtn.style.display = "none";
    }
    if (prop === "ball") {
        console.log("juggling balls");
        console.log(prop)
        // window.svgStill.style.display = "none";
        // window.canvasStill.style.display = "none";
        // window.stillBallSvg.style.display="block";
        hidding(current, stillBallSvg);
        // current = window.stillBallSvg;
    } else if (prop === "poi") {
        hidding(current, stillPoiSvg);
        // current = stillPoiSvg;

    } else if (prop === "ring") {
        console.log("ring");
        hidding(current, stillRingSvg);
        // current = window.stillRingSvg;
    }
});

export { current, hidding };