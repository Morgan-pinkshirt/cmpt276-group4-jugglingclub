

const typeElems = document.getElementById('hproductType');
const colorElems = document.getElementById('hproductColor');
const bodyColorElems = document.getElementById('hbodyColor');
const brightness = document.getElementById("hbright");
const saturation = document.getElementById("hsat");
const effect = document.getElementById("heffect");

document.getElementById("savingform").addEventListener('submit', function(evt) {
    typeElems.value = document.getElementById('productType').value;
    colorElems.value = document.getElementById('productColor').value;
    bodyColorElems.value = document.getElementById('bodyColor').value;
    brightness.value = document.getElementById('brightnessRange').value;
    saturation.value = document.getElementById('saturationRange').value;
    effect.value = document.getElementById('effectSelect').value;
});