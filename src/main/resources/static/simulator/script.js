const club = document.getElementById("clubBody");
const handle = document.getElementById("clubHandle");
const slider = document.getElementById("colourSlider");
const bodyButton = document.getElementById("bodyButton");
const handleButton = document.getElementById("handleButton");

let selectedPart = "body";
let bodyColour = 0;
let handleColour = 0;

bodyButton.addEventListener("click", function() {
    selectedPart = "body";
    slider.value = bodyColour;

    bodyButton.classList.add("active");
    handleButton.classList.remove("active");
});

handleButton.addEventListener("click", function() {
    selectedPart = "handle";
    slider.value = handleColour;

    handleButton.classList.add("active");
    bodyButton.classList.remove("active");
});

slider.addEventListener("input", function() {

    let colour = "hsl(" + slider.value + ", 100%, 50%)";

    if (selectedPart === "body") {
        club.setAttribute("fill", colour);
        bodyColour = slider.value;
    } else {
        handle.setAttribute("fill", colour);
        handleColour = slider.value;
    }

});

bodyButton.classList.add("active");