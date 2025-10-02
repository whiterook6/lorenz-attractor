import { LorenzAttractor } from "./lorenzAttractor";
import { Buffer } from "./buffer";
import { Camera } from "./camera";
import { getCanvas, getCanvasContext } from "./canvasContext";
import { Point3 } from "./types";

// generate points from the attractor
const pointBuffer = new Buffer<Point3>(1000);
pointBuffer.add([
  Math.random() * 20 - 10,
  Math.random() * 20 - 10,
  Math.random() * 20 - 10,
]); // initial condition
const attractor = new LorenzAttractor();

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
camera.offsetX = window.innerWidth / 2;
camera.offsetY = window.innerHeight / 2;
camera.scale = 16;

const step = () => {
  const currentPoint = pointBuffer.current();
  if (!currentPoint) {
    return;
  }

  pointBuffer.add(attractor.step(currentPoint, 0.01));
};

let isPaused = false;
window.addEventListener("keydown", (event) => {
  if (event.key === " ") {
    isPaused = !isPaused;
  } else if (event.key === ".") {
    if (isPaused) {
      step();
    }
  }
});

context.fillStyle = "#1a1a1a"; // Dark gray background
const render = () => {
  context.fillRect(0, 0, canvas.width, canvas.height);
  if (!isPaused) {
    step();
  }

  if (pointBuffer.empty()) {
    return;
  }
  // draw trailLength points per frame
  context.beginPath();
  let previousPoint: Point3 | undefined = undefined;
  for (const currentPoint of pointBuffer) {
    if (!previousPoint) {
      previousPoint = currentPoint;
      continue;
    }

    const [canvasX, canvasY] = camera.transform(currentPoint);
    const [prevCanvasX, prevCanvasY] = camera.transform(previousPoint);

    context.strokeStyle = `hsl(240, 100%, 50%)`;
    context.moveTo(prevCanvasX, prevCanvasY);
    context.lineTo(canvasX, canvasY);
    previousPoint = currentPoint;
  }

  context.stroke();
  requestAnimationFrame(render);
};

requestAnimationFrame(render);
