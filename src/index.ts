import { getCanvas, getCanvasContext } from "./canvasContext";
import { Buffer } from "./buffer";
import { buildLyapunovAttractor, buildRandomLyapyunovAttractor, LyapunovSimulator } from "./lyapunovAttractor";
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
// const attractor = buildRandomLyapyunovAttractor();
const simulator = new LyapunovSimulator(attractor, [
  Math.random() - 0.5,
  Math.random() - 0.5,
]);

const buffer = new Buffer<Point2>(10_000_000);
for (let step = 0; step < 10_000_000; step++) {
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

const pixelDensity = new Float32Array(canvas.width * canvas.height);
let max = 0;
for (const point of buffer) {
  const x =
    ((point[0] - simulator.bounds.xmin) /
      (simulator.bounds.xmax - simulator.bounds.xmin)) *
    canvas.width;
  const y =
    ((point[1] - simulator.bounds.ymin) /
      (simulator.bounds.ymax - simulator.bounds.ymin)) *
    canvas.height;
  if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
    pixelDensity[Math.floor(x) + Math.floor(y) * canvas.width]++;
  }
}

for (let i = 0; i < pixelDensity.length; i++) {
  if (pixelDensity[i] > max) {
    max = pixelDensity[i];
  }
}
const maxDensity = max;
const imageData = context.createImageData(canvas.width, canvas.height);

function flameColor(t: number): [number, number, number] {
  // t: 0 = dark, 1 = brightest
  if (t < 0.5) {
    // dark orange → yellow
    const f = t / 0.5;
    return [
      255,
      Math.floor(100 + 155 * f),
      0
    ];
  } else {
    // yellow → white
    const f = (t - 0.5) / 0.5;
    return [
      255,
      255,
      Math.floor(0 + 255 * f)
    ];
  }
}

for (let i = 0; i < pixelDensity.length; i++) {
  const density = pixelDensity[i];
  if (density > 0) {
    const [r, g, b] = flameColor(Math.pow(density / maxDensity, 0.5));
    imageData.data[i * 4] = r; // R
    imageData.data[i * 4 + 1] = g; // G
    imageData.data[i * 4 + 2] = b; // B
    imageData.data[i * 4 + 3] = 255; // A
  }
}
context.putImageData(imageData, 0, 0);
