import {
  buildAttractorFromString,
  LyapunovSimulator,
} from "../attractors/lyapunovAttractor";
import { Camera } from "../camera";
import { Point2 } from "../types";
import { Scene } from "./scene";

/**
 * @param t 0 = dark, 1 = brightest
 */
function flameColor(t: number): [number, number, number] {
  if (t < 0.5) {
    // dark orange → yellow
    const f = t / 0.5;
    return [255, Math.floor(100 + 155 * f), 0];
  } else {
    // yellow → white
    const f = (t - 0.5) / 0.5;
    return [255, 255, Math.floor(0 + 255 * f)];
  }
}

export class LyapunovScene extends Scene {
  async _run(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D): Promise<void> {
    // Use CSS pixel dimensions for camera setup
    const cssWidth = window.innerWidth;
    const cssHeight = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    const imageData = context.createImageData(canvas.width, canvas.height);
    
    
    // Register service worker and set up messaging
    if (!('Worker' in window)){
      return;
    }

    const attractorString = "FIRCDERRPVLD"; // Example attractor string
    const result = await new Promise((resolve, reject) => {
      const worker = new Worker("./worker.js");
      worker.postMessage({
        type: "lyapunov",
        payload: attractorString
      });
      worker.onmessage = (event) => {
        resolve(event.data);
      };
      worker.onerror = (error) => {
        reject(error);
      };
    });

    const { data: {points, bounds}} = result as { data: {points: Float32Array; bounds: { xmin: number; xmax: number; ymin: number; ymax: number }}};

    // Calculate scale and offset so bounds fit inside canvas (in CSS pixels)
    const boundsWidth = bounds.xmax - bounds.xmin;
    const boundsHeight = bounds.ymax - bounds.ymin;
    const scale = Math.min(cssWidth / boundsWidth, cssHeight / boundsHeight);

    // setup camera
    const camera = new Camera();
    camera.enable();
    camera.scale = Math.max(0, scale);
    camera.offsetX = cssWidth / 2 - scale * (bounds.xmin + boundsWidth / 2);
    camera.offsetY = cssHeight / 2 - scale * (bounds.ymin + boundsHeight / 2);

    const render = () => {
      imageData.data.fill(1); // clear to white
      const pixelDensity = new Float32Array(canvas.width * canvas.height);
      // Map camera output (CSS pixels) to device pixels for density
      for (let i = 0; i < points.length; i += 2) {
        const point: Point2 = [points[i], points[i + 1]];
        const [x, y] = camera.transform([point[0], point[1], 0]); // x, y in CSS pixels
        // Convert CSS pixel coordinates to device pixel coordinates
        const deviceX = Math.floor(x * dpr);
        const deviceY = Math.floor(y * dpr);
        if (
          deviceX >= 0 &&
          deviceX < canvas.width &&
          deviceY >= 0 &&
          deviceY < canvas.height
        ) {
          pixelDensity[deviceX + deviceY * canvas.width]++;
        }
      }

      let maxDensity = 0;
      for (let i = 0; i < pixelDensity.length; i++) {
        if (pixelDensity[i] > maxDensity) {
          maxDensity = pixelDensity[i];
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
    };

    render();
  }
}
