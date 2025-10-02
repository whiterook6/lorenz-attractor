import { getCanvas, getCanvasContext } from "./canvasContext";
import { Buffer } from "./buffer";
import { buildLyapunovAttractor, LyapunovSimulator } from "./lyapunovAttractor";
import { Point2 } from "./types";

// setup canvas and context
const canvas = getCanvas("myCanvas");
const context = getCanvasContext(canvas);

// set canvas size and scale for high-DPI screens
const dpr = window.devicePixelRatio || 1;
canvas.width = window.innerWidth * dpr;
canvas.height = window.innerHeight * dpr;
canvas.style.width = window.innerWidth + "px";
canvas.style.height = window.innerHeight + "px";

// const batch = () => {
//   console.log("Starting new batch");
//   outerloop: for (let attempt = 0; attempt < 1000; attempt++) {
const attractor = buildLyapunovAttractor(
  [
    -0.17793205972274895, -0.752757898782072, 0.2096454583786509,
    -0.9677930442217269, 0.2511817307716946, 0.6786647238311332,
  ],
  [
    0.4851403353159134, -0.5022700528291197, -0.07924395276658402,
    -0.058823336874939125, -0.8775969680149762, -0.6448562370328643,
  ]
);
const simulator = new LyapunovSimulator(attractor, [
  Math.random() - 0.5,
  Math.random() - 0.5,
]);

const buffer = new Buffer<Point2>(100000);
for (let step = 0; step < 100000; step++) {
  const p = simulator.step();
  if (!Number.isFinite(p[0]) || !Number.isFinite(p[1])) {
    if (step < 100) {
      break;
    }
  } else {
    buffer.add(p);
  }
}

console.log(`Lyapunov Exponent: ${simulator.getLyapunovExponent()}`);
console.log(`Bounds: ${JSON.stringify(simulator.bounds)}`);
console.log(`Attractor function: ${attractor.toString()}`);

// clear canvas
context.fillStyle = "#000"; // black background
context.fillRect(0, 0, canvas.width, canvas.height);

// draw points
context.fillStyle = "#00ff0099"; // green points
for (const point of buffer) {
  const x =
    ((point[0] - simulator.bounds.xmin) /
      (simulator.bounds.xmax - simulator.bounds.xmin)) *
    canvas.width;
  const y =
    ((point[1] - simulator.bounds.ymin) /
      (simulator.bounds.ymax - simulator.bounds.ymin)) *
    canvas.height;
  context.fillRect(x, y, 1, 1);
}
