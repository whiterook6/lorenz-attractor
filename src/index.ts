import { time } from "console";
import { LorenzAttractor } from "./attractor";
import { Camera } from "./camera";
import { getCanvas, getCanvasContext } from "./canvasContext";
import { Point3 } from "./types";

// generate points from the attractor
let currentPoint: Point3 = [0.1, 0, 0];
const points: Point3[] = [];
const attractor = new LorenzAttractor();
for (let i = 0; i < 10000; i++) {
  const stepSize = Math.max(attractor.getTimestep(currentPoint, 0.5), 0.001);
  currentPoint = attractor.step([...currentPoint], stepSize);
  points.push(currentPoint);
}

// get the rendering context
const canvas = getCanvas("myCanvas");
const context = getCanvasContext(canvas);
const resizeCanvas = () => {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  context.setTransform(dpr, 0, 0, dpr, 0, 0); // scale all drawing
};
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// a camera with its own interaction built-in
const camera = new Camera();

// nice starting values for this scene.
camera.offsetX = 667.8353340026421;
camera.offsetY = 323.6764229710278;
camera.scale = 15.863092971714982;


const trailLength = 1000;
let maxFrame = points.length - 1000;
let frame = Math.floor(Math.random() * maxFrame) + 1;
const step = () => {
  frame = (frame % maxFrame) + 1;
}

let isPaused = false;
window.addEventListener("keydown", (event) => {
  if (event.key === " ") {
    isPaused = !isPaused;
  } else if (event.key === "."){
    if (isPaused){
      step();
    }
  }
});


context.fillStyle = "#1a1a1a"; // Dark gray background
const render = () => {
  context.fillRect(0, 0, canvas.width, canvas.height);
  if (!isPaused){
    step();
  }

  // draw trailLength points per frame
  context.beginPath();

  for (let i = frame; i < frame + trailLength; i++) {
    const point = points[i];
    const previousPoint = points[i - 1];
    
    const [canvasX, canvasY] = camera.transform(point);
    const [prevCanvasX, prevCanvasY] = camera.transform(previousPoint);

    const hue = Math.floor((i / points.length) * 360);
    context.strokeStyle = `hsl(${hue}, 100%, 50%)`;
    context.moveTo(prevCanvasX, prevCanvasY);
    context.lineTo(canvasX, canvasY);
  }

  context.stroke();
  requestAnimationFrame(render);
};

requestAnimationFrame(render);

