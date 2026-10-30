// class Club {
//     club;
//     const handle;
//     body;
// }

// const canvas = document.getElementById("club");
// const ctx = canvas.getContext("2d");

// if (canvas.getContext) {
//   const ctx = canvas.getContext("2d");
//   // drawing code here
// } else {
//   // canvas-unsupported code here
// }

// function draw() {
const img = document.getElementById("test");
const canvas = document.getElementById("club");
const ctx = canvas.getContext("2d");
// const clickedButton = document.getElementById('view-button');

// function draw() {
img.addEventListener("load", (e) => {


	// ctx.save();
	// ctx.beginPath();
	// ctx.moveTo(60, 20);
	// ctx.bezierCurveTo(20, 20, 25, 100, 50, 160); // wrong command
	// ctx.lineTo(70, 160);
	// ctx.bezierCurveTo(95, 100, 100, 20, 60, 20);
	// ctx.moveTo(50, 160);
	// ctx.lineTo(50, 270);
	// // ctx.lineTo()
	// ctx.lineTo(70, 270);
	// ctx.lineTo(70, 160)
	// // ctx.closePath();
	
	// ctx.clip();
	// ctx.drawImage(img, 0, 0);
	ctx.save();
	ctx.beginPath();
	ctx.moveTo(385, 25);
	ctx.bezierCurveTo(345, 25, 350, 105, 375, 165); // wrong command
	ctx.lineTo(395, 165);
	ctx.bezierCurveTo(420, 105, 425, 25, 385, 25);
	ctx.moveTo(375, 165);
	ctx.lineTo(375, 275);
	// ctx.lineTo()
	ctx.lineTo(395, 275);
	ctx.lineTo(395, 165)
	// ctx.closePath();
	
	ctx.clip();
	ctx.drawImage(img, 0, 20);
	// ctx.restore();
	// ctx.fill();
	// draw();


	// Create a circular clipping region
	// Draw image onto canvas
	// ctx.drawImage(image, 0, 0);
});
// }

clickedButton.addEventListener('click', async function () {
    // resultDiv.style.visibility = 'hidden';
    try { 
        const mode = document.getElementById("options").value;
        // if (city == "none") throw "no city";
        // getCity(city);
		draw();
    }
    catch (error) {
        catchError(error);
    }
});

//  <svg width="120" height="300" viewBox="0 0 120 300">
//         <!-- Club Body (LED) -->
//         <path
//             id="clubBody"
//             d="M60 20 C20 20 25 100 50 160 L70 160 C95 100 100 20 60 20"
//             fill="grey"/>
//         <!-- Club Handle (white) -->
//         <rect
//             x="50"
//             y="160"
//             width="20"
//             height="110"
//             fill="white"/>
//         <!-- Club Base (black) -->
//         <rect
//             x="47"
//             y="265"
//             width="26"
//             height="15"
//             rx="15"
//             fill="black"/>
//     </svg>



// Working:
// ctx.save();
// 	ctx.beginPath();
// 	ctx.moveTo(60, 20);
// 	ctx.bezierCurveTo(20, 20, 25, 100, 50, 160); // wrong command
// 	ctx.lineTo(70, 160);
// 	ctx.bezierCurveTo(95, 100, 100, 20, 60, 20);
// 	ctx.moveTo(50, 160);
// 	ctx.lineTo(50, 270);
// 	// ctx.lineTo()
// 	ctx.lineTo(70, 270);
// 	ctx.lineTo(70, 160)
// 	// ctx.closePath();
	
// 	ctx.clip();
// 	ctx.drawImage(img, 0, 0);