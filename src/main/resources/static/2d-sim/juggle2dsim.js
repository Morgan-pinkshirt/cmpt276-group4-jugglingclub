console.log("found this script!");
console.log("product color = " + document.getElementById("productcolor").value);
console.log("body color =" + document.getElementById("bodycolor").value);
console.log("product type =" + document.getElementById("producttype").value);
console.log("effect = " +document.getElementById("effect").value )
const canvasStill = document.getElementById("canvas_still");
const ctxStill = canvasStill.getContext('2d');

const canvasBall = document.getElementById("canvas_ball");
const ctxBall = canvasBall.getContext('2d');

const canvasRing = document.getElementById("canvas_ring");
const ctxRing = canvasRing.getContext('2d');

const canvasPoi = document.getElementById("canvas_poi");
const ctxPoi = canvasPoi.getContext('2d');

const canvasStaff = document.getElementById("canvas_staff");
const ctxStaff = canvasStaff.getContext('2d');
