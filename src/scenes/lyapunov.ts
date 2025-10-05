/* global Worker */

import { Camera } from "../rendering/camera";
import { FlameRenderer } from "../rendering/flameRenderer";
import { Point2 } from "../types";
import { Scene } from "./scene";

export class LyapunovScene extends Scene {
  async _run(
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D
  ): Promise<void> {
    // Use CSS pixel dimensions for camera setup
    const cssWidth = window.innerWidth;
    const cssHeight = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    const imageData = context.createImageData(canvas.width, canvas.height);

    // Register web worker and set up messaging
    if (!("Worker" in window)) {
      return;
    }

    const attractorString = "FIRCDERRPVLD"; // Example attractor string
    const result = await new Promise((resolve, reject) => {
      const worker = new Worker("./worker.js");
      worker.postMessage({
        type: "lyapunov",
        payload: {
          attractor: attractorString,
          points: 100_000,
          skip: 100,
        },
      });
      worker.onmessage = (event) => {
        resolve(event.data);
      };
      worker.onerror = (error) => {
        reject(error);
      };
    });

    const {
      data: { points, bounds },
    } = result as {
      data: {
        points: Float32Array;
        bounds: { xmin: number; xmax: number; ymin: number; ymax: number };
      };
    };

    // setup camera with an initial fit to bounds
    const camera = new Camera();
    camera.fitBounds(
      {
        left: bounds.xmin,
        right: bounds.xmax,
        top: bounds.ymin,
        bottom: bounds.ymax,
      },
      cssWidth,
      cssHeight
    );

    // enable mouse controls for camera
    camera.enable();

    const pixelDensity = new Float32Array(canvas.width * canvas.height);
    const render = () => {
      imageData.data.fill(1); // clear to white
      pixelDensity.fill(0); // reset density
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

      FlameRenderer.render(pixelDensity, imageData);
      context.putImageData(imageData, 0, 0);
      requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
  }
}
