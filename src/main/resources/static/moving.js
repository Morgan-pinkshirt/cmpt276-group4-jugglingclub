// https://zetcode.com/canvas-api/rotate/. 31/10/26

const canvas = document.getElementById('club');
const ctx = canvas.getContext('2d');
const img = document.getElementById("img");
const clickedButton = document.getElementById("view-button");

let angle = 0;
const centerX = 399;
const centerY = 347;

function draw() {
    ctx.save();
    ctx.clearRect(0, 0, 1200, 1200);
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);

    ctx.translate(-centerX, -centerY);	
	
    ctx.beginPath();

    ctx.moveTo(385, 23);
    ctx.bezierCurveTo(345, 23, 350, 103, 375, 163);
    ctx.lineTo(395, 163);
    ctx.bezierCurveTo(420, 103, 425, 23, 385, 23);
    ctx.moveTo(375, 163);
    ctx.lineTo(375, 273);
    ctx.lineTo(395, 273);
    ctx.lineTo(395, 163);
    ctx.clip();

    ctx.setTransform(1,0,0,1,0,0);
    ctx.closePath();
    ctx.drawImage(img, 70, 20);
	

    ctx.restore();

    // Increase angle for next frame
    angle += 0.02;
    if (angle > Math.PI * 2) angle = 0;
    
    // Request next animation frame
    requestAnimationFrame(draw);
}

// Start animation
draw();

clickedButton.addEventListener('click', function () {
	const mode = document.getElementById("options").value;
	img.src=`img/${mode}.png`;
	angle = 0;
});