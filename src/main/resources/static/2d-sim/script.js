// Use of AI (one of ChatGPT's solution when I was trying to understand testing) to change the variables that are needed on both moving.js and script.js to window.[name] - November 13th.

const club = document.getElementById("clubBody");
const handle = document.getElementById("clubHandle");
const clubMov = document.getElementById("BodyMov");
const handleMov = document.getElementById("HandleMov");

const slider = document.getElementById("colourSlider");
const bodyButton = document.getElementById("bodyButton");
const handleButton = document.getElementById("handleButton");

window.svgStill = document.getElementById("svg_still");
window.svgMov = document.getElementById("svg_moving");

let selectedPart = "body";
let bodyColour = 0;
let handleColour = 0;

function changeVisibilityColor() {
    window.svgStill.style.display = "block";
    window.canvasStill.style.display = "none";
    window.svgMov.style.display = "block";
    window.canvasMov.style.display = "none";
    window.modeName.style.visibility = "hidden";
}

bodyButton.addEventListener("click", function() {
    selectedPart = "body";
    slider.value = bodyColour;
    changeVisibilityColor();

    bodyButton.classList.add("active");
    handleButton.classList.remove("active");
});

handleButton.addEventListener("click", function() {
    selectedPart = "handle";
    slider.value = handleColour;
    changeVisibilityColor();

    handleButton.classList.add("active");
    bodyButton.classList.remove("active");
});

slider.addEventListener("input", function() {
    changeVisibilityColor();
    changeColor(club, handle);
    changeColor(clubMov, handleMov);

});

function changeColor(body, handle) {
    let colour = "hsl(" + slider.value + ", 100%, 50%)";
    if (selectedPart === "body") {
        body.setAttribute("fill", colour);
        bodyColour = slider.value;
    } else {
        handle.setAttribute("fill", colour);
        handleColour = slider.value;
    }
}


bodyButton.classList.add("active");