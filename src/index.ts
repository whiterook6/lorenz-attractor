import { getCanvas, getCanvasContext } from "./canvasContext";
import { Buffer } from "./buffer";
import {
  buildRandomLyapyunovAttractor,
  LyapunovSimulator,
} from "./lyapunovAttractor";
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

// run main loop
outerloop: while (true) {
  const attractor = buildRandomLyapyunovAttractor();
  const simulator = new LyapunovSimulator(attractor, [
    Math.random() - 0.5,
    Math.random() - 0.5,
  ]);

  const buffer = new Buffer<Point2>(10000);
  for (let i = 0; i < 2000; i++) {
    const newPoint = simulator.step();
    if (isNaN(newPoint[0]) || isNaN(newPoint[1])) {
      console.log("Encountered NaN, restarting...");
      continue outerloop;
    }
    buffer.add(newPoint);
  }

  const state = simulator.getClassification();
  if (state === "divergent" || state === "convergent") {
    console.log(`Skipping ${state} attractor`);
    continue outerloop;
  } else {
    console.log(`Using ${state} attractor`);
  }

  for (let i = 0; i < 50000; i++) {
    const newPoint = simulator.step();
    if (isNaN(newPoint[0]) || isNaN(newPoint[1])) {
      console.log(`Encountered NaN after ${i} iterations, restarting...`);
      continue outerloop;
    }
    buffer.add(newPoint);
  }

  // clear canvas
  context.fillStyle = "#000"; // black background
  context.fillRect(0, 0, canvas.width, canvas.height);

  // draw points
  context.fillStyle = "#00ff0099"; // green points
  console.log(simulator.bounds);
  console.log(buffer.items.slice(1000, 1100));
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
  break;
}
