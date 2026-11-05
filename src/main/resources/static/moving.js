// https://zetcode.com/canvas-api/rotate/. 31/10/26

const canvas = document.getElementById('club');
const ctx = canvas.getContext('2d');

const clickedButton = document.getElementById("view-button");

const modeName = document.getElementById("mode_name");

let angle = 0;

const centerX = 101.5;
const centerY = 443;

function draw() {
    const img = document.getElementById("img");
    ctx.save();

    ctx.beginPath();
	ctx.moveTo(90, 120);
	ctx.lineTo(90, 233);
	ctx.lineTo(103, 333);
	ctx.lineTo(103, 120);
	ctx.moveTo(90, 220);

	ctx.bezierCurveTo(55, 290, 70, 350, 83, 365);
	ctx.lineTo(100, 365);
	ctx.bezierCurveTo(115, 350, 130, 290, 103, 220);
    ctx.closePath();
    ctx.clip();

    ctx.setTransform(1,0,0,1,0,0);
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    ctx.translate(-centerX, -centerY);	

    ctx.drawImage(img, -230, 120);
    ctx.restore();

    // Increase angle for next frame
    angle -= 0.02;
    if (angle > Math.PI * 2) {
        angle = 0;
        counter = 0;
    }
    
    // Request next animation frame
    requestAnimationFrame(draw);
}

// Start animation
draw();

function numberTen(mode) {
    if (mode[4] != "_") {
        modeName.innerHTML += mode[4];
        return 5;
    }
    return 4
}

clickedButton.addEventListener('click', function () {
	const mode = document.getElementById("options").value;
    let i = 4;
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
            i = 5;
            modeName.innerHTML += mode[5];
            i = 6;
        }
    }
    modeName.innerHTML += " - "
    while (i < mode.length) {
        if (mode[i] == "_") {
            modeName.innerHTML += " ";
        } else {
            modeName.innerHTML += mode[i]; 
        }
        i++;
    }
	img.src=`img/${mode}.png`;
	angle = 0;

});