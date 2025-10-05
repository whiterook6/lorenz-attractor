/* global self */

import {
  buildAttractorFromString,
  LyapunovSimulator,
} from "./attractors/lyapunovAttractor";

type MessageToWorker<T> = {
  type: "lyapunov";
  payload: T;
}

// Service Worker for heavy calculations
self.addEventListener("message", (event: {
  data: MessageToWorker<{attractor: string}>;
}) => {
  // Handle incoming messages
  switch (event.data.type) {
    case "lyapunov":
      const { attractor: attractorString } = event.data.payload;
      const attractor = buildAttractorFromString(attractorString);
      const simulator = new LyapunovSimulator(attractor, [0.1, 0.1]);
      const array = new Float32Array(40_000_000 * 2);
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
    default:
      console.error("Unknown message type:", event.data);
      break;
  }
});
