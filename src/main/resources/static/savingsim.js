

const typeElems = document.getElementById('hproductType');
const colorElems = document.getElementById('hproductColor');
const bodyColorElems = document.getElementById('hbodyColor');


document.getElementById("savingform").addEventListener('submit', function(evt) {
    typeElems.value = document.getElementById('productType').value;
    colorElems.value = document.getElementById('productColor').value;
    bodyColorElems.value = document.getElementById('bodyColor').value;
});