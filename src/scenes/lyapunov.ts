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
    if (!("Worker" in window)) {
      return;
    }

    // Use CSS pixel dimensions for camera setup
    const cssWidth = window.innerWidth;
    const cssHeight = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    const imageData = context.createImageData(canvas.width, canvas.height);
    const initialAttractorString = "MSSSRRPADDSO"; // Example attractor string

    const camera = new Camera();
    const pattern = {
      points: new Float32Array(),
      bounds: { xmin: 0, xmax: 0, ymin: 0, ymax: 0 },
    };

    const generatePoints = async (attractorString: string) => {
      const result = await new Promise<{
        data: { points: Float32Array; bounds: { xmin: number; xmax: number; ymin: number; ymax: number } };
      }>((resolve, reject) => {
        const worker = new Worker("./worker.js");
        worker.postMessage({
          type: "lyapunov",
          payload: {
            attractor: attractorString,
            points: 10_000_000,
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

      pattern.points = result.data.points as Float32Array<ArrayBuffer>;
      pattern.bounds = result.data.bounds as { xmin: number; xmax: number; ymin: number; ymax: number };
      camera.fitBounds(
        {
          left: pattern.bounds.xmin,
          right: pattern.bounds.xmax,
          top: pattern.bounds.ymin,
          bottom: pattern.bounds.ymax,
        },
        cssWidth,
        cssHeight
      );
      console.log("Generated attractor with bounds:", pattern.bounds);
    };

    generatePoints(initialAttractorString);
    let isGenerating = false;
    // on key press R, regenerate with a random attractor string
    window.addEventListener("keydown", async (event) => {
      if (isGenerating) {
        return;
      }
      if (event.key === "r" || event.key === "R") {
        isGenerating = true;
        const allChars = "ABCDEFGHIJKLMNOPQRSTUVWXY";
        let randomAttractor = "";
        const length = 12;
        for (let i = 0; i < length; i++) {
          const randomIndex = Math.floor(Math.random() * allChars.length);
          randomAttractor += allChars[randomIndex];
        }
        console.log("Generating new attractor:", randomAttractor);
        await generatePoints(randomAttractor);
        isGenerating = false;
      }
    });


    // enable mouse controls for camera
    camera.enable();

    const pixelDensity = new Float32Array(canvas.width * canvas.height);
    const render = () => {
      imageData.data.fill(1); // clear to white
      pixelDensity.fill(0); // reset density
      // Map camera output (CSS pixels) to device pixels for density
      for (let i = 0; i < pattern.points.length; i += 2) {
        const point: Point2 = [pattern.points[i], pattern.points[i + 1]];
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
