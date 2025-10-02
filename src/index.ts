import { getCanvas, getCanvasContext } from "./canvasContext";
import { generateAttractor } from "./test";

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

const run = () => {
  const result = generateAttractor({
    maxIterations: 80000,
    canvas,
    context,
    drawThresholdStart: 100
  });

  console.log('result:', result.classification, 'lyapunov=', result.lyapunov);
  if (result.classification === 'chaotic') {
    console.log('chaotic attractor coefficients:', result.ax, result.ay);
  } else {
    console.log('not chaotic, coefficients:', result.ax, result.ay);
    requestAnimationFrame(run);
  }
};

requestAnimationFrame(run);