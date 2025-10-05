/* global self */

import {
  buildAttractorFromString,
  LyapunovSimulator,
} from "./attractors/lyapunovAttractor";

// Web Worker for heavy calculations
self.addEventListener(
  "message",
  (event: {
    data: {
      type: "lyapunov";
      payload: {
        attractor: string;
        points: number;
        skip: number;
      };
    };
  }) => {
    // Handle incoming messages
    switch (event.data.type) {
      case "lyapunov": {
        const {
          attractor: attractorString,
          points: numPoints,
          skip,
        } = event.data.payload;
        const attractor = buildAttractorFromString(attractorString);
        const simulator = new LyapunovSimulator(attractor, [0.1, 0.1]);
        const array = new Float32Array(numPoints * 2);
        for (let i = 0; i < skip; i++) {
          simulator.step(); // Skip initial points
        }

        for (let i = 2; i < array.length; i += 2) {
          const next = simulator.step();
          array[i] = next[0];
          array[i + 1] = next[1];
        }

        self.postMessage({
          type: "RESULT",
          data: {
            points: array,
            bounds: simulator.bounds,
          },
        });
        break;
      }
      default:
        console.error("Unknown message type:", event.data);
        break;
    }
  }
);
