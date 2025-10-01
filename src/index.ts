import { LorenzAttractor } from "./attractor";
import { Camera } from "./camera";
import { getCanvas, getCanvasContext } from "./canvasContext";
import { Point3 } from "./types";

// generate points from the attractor
let currentPoint: Point3 = [0.1, 0, 0];
const points: Point3[] = [];
const attractor = new LorenzAttractor();
for (let i = 0; i < 10000; i++) {
  const stepSize = attractor.getTimestep(currentPoint, 0.5);
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


const render = () => {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "black";

  for (const point of points) {
    const [canvasX, canvasY] = camera.transform(point);
    context.fillRect(canvasX, canvasY, 1, 1);
  }

  requestAnimationFrame(render);
};

requestAnimationFrame(render);

