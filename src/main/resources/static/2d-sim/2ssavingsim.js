
const typeElems = document.getElementById('hproductType');
const colorElems = document.getElementById('hproductColor');
const bodyColorElems = document.getElementById('hbodyColor');
const brightness = document.getElementById("hbright");
const saturation = document.getElementById("hsat");
const effect = document.getElementById("heffect");

//find the place where the values need to be plugged in...
document.getElementById("savingform").addEventListener('submit', function(evt) {
    //TODO: make typeElems.value not hard coded after it is impletented!!
    typeElems.value = "club"; //there is yet a way to for 2d to set this value so
    brightness.value = document.getElementById('static-brightness').value;
    saturation.value = document.getElementById('static-saturation').value;
    effect.value = document.getElementById('options').value;
    if(document.getElementById("UID").value == ""){
        document.getElementById("UID").value = "new";
    }
    if(colorElems.value == ""){
        colorElems.value = "#D3D3D3";
    }
    if(bodyColorElems.value == ""){
        bodyColorElems.value = "#D3D3D3";
    }
});


