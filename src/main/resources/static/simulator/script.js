const club = document.getElementById("clubBody");
const slider = document.getElementById("colourSlider");

slider.addEventListener("input", function() {
    let colour = "hsl(" + slider.value + ", 100%, 50%)";
    club.setAttribute("fill", colour);
});