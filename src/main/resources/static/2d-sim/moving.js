// https://zetcode.com/canvas-api/rotate/. 31/10/26
// Use of AI (one of ChatGPT's solution when I was trying to understand testing) to change the variables that are needed on both moving.js and script.js to window.[name] - November 13th.

window.canvasMov = document.getElementById('canvas_moving');
const ctxMov = canvasMov.getContext('2d');

window.canvasStill = document.getElementById("canvas_still");
const ctxStill = canvasStill.getContext('2d');

const clickedButton = document.getElementById("view-button");

window.modeName = document.getElementById("mode_name");

let angleMov = 0;
let angleStill = 0;

const centerX = 101.5;
const centerY = 443;

function draw(ctx, angle, type) {
    const img = document.getElementById("img");
    ctx.save();

    ctx.beginPath();
    ctx.fillStyle = "rgb(231, 231, 250)";
    ctx.fillRect(87, 113, 20, 7);
	ctx.moveTo(90, 120);
	ctx.lineTo(90, 223);
	ctx.lineTo(103, 323);
	ctx.lineTo(103, 120);
	ctx.moveTo(90, 230);

	ctx.bezierCurveTo(55, 290, 70, 350, 83, 365);
	ctx.lineTo(100, 365);
	ctx.bezierCurveTo(115, 350, 130, 290, 103, 230);
    ctx.closePath();
    ctx.clip();

    ctx.setTransform(1,0,0,1,0,0);
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    ctx.translate(-centerX, -centerY);	

    // To  wait for the image to load: https://stackoverflow.com/questions/42515769/how-to-wait-for-loading-images-in-canvas
    if (img.complete) {
        ctx.drawImage(img, -230, 120);
    }
    ctx.restore();

    // Increase angle for next frame
    if (type == "moving") {
        angle += 0.01 * (window.jestersSpeed ?? 1);
    } else if (type == "still") {
        angle += 0.0075;
    }

    if (angle > Math.PI * 2) {
        angle = 0;
        counter = 0;
    }
    
    // Request next animation frame

    // ChatGPT November 7th, 2026, "How can I pass the variable ctx = canvas.getContext('2d') as a parameter of my draw function". Solve the issue of not being able to pass the variable ctx as a paramter, or getting it flagged as an infinite loop. I used it for the requestAnimationFrame
    requestAnimationFrame(() => draw(ctx, angle, type));
}

// Start animation
draw(ctxMov, angleMov, "moving");
draw(ctxStill, angleStill, "still");

function numberTen(mode) {
    if (mode[4] != "_") {
        modeName.innerHTML += mode[4];
        return 6;
    }
    return 5
}

clickedButton.addEventListener('click', function () {
	const mode = document.getElementById("options").value;
    let i = 5;
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
            i = 6;
            modeName.innerHTML += mode[5];
            i = 7;
        }
    }
    modeName.innerHTML += ` - ${mode[i].toUpperCase()}`;
    i++;
    while (i < mode.length) {
        if (mode[i] == "_") {
            modeName.innerHTML += ` ${mode[i+1].toUpperCase()}`;
            i++;
        // } else if (mode[i] == "-") {
        //     modeName.innerHTML += "/";
        } else {
            modeName.innerHTML += mode[i]; 
        }
        i++;
    }
	img.src=`img/${mode}.png`;
    angle = 0;
    window.svgMov.style.display = "none";
    window.canvasMov.style.display = "block";
    window.svgStill.style.display = "none";
    window.canvasStill.style.display = "block";
    window.modeName.style.visibility = "visible";
});