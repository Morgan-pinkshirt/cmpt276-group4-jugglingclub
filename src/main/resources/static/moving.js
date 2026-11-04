// https://zetcode.com/canvas-api/rotate/. 31/10/26

const canvas = document.getElementById('club');
const ctx = canvas.getContext('2d');

const clickedButton = document.getElementById("view-button");

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


clickedButton.addEventListener('click', function () {
	const mode = document.getElementById("options");
    const modeName = document.getElementById("mode_name");
    // modeName.innerHTML = mode.value;
	img.src=`img/${mode.value}.png`;
	angle = 0;

});