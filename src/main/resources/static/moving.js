// https://zetcode.com/canvas-api/rotate/. 31/10/26

const canvas = document.getElementById('club');
const ctx = canvas.getContext('2d');

const clickedButton = document.getElementById("view-button");

let angle = 0;

const centerX = 401.5;
const centerY = 448;

function draw() {
    const img = document.getElementById("img");
    ctx.save();
    ctx.clearRect(0, 0, 1200, 1200);
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);

    ctx.translate(-centerX, -centerY);	
	
    ctx.beginPath();
	ctx.moveTo(390, 120);
	ctx.lineTo(390, 233);
	ctx.lineTo(403, 333);
	ctx.lineTo(403, 120);
	ctx.moveTo(390, 220);

	ctx.bezierCurveTo(355, 290, 370, 350, 383, 365);
	ctx.lineTo(400, 365);
	ctx.bezierCurveTo(415, 350, 430, 290, 403, 220);
    ctx.closePath();
    ctx.clip();

    ctx.setTransform(1,0,0,1,0,0);
    ctx.drawImage(img, 70, 120);


    ctx.restore();

    // Increase angle for next frame
    angle += 0.02;
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