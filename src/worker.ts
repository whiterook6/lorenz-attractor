import { buildAttractorFromString, LyapunovSimulator } from "./attractors/lyapunovAttractor";

// Service Worker for heavy calculations
self.addEventListener("message", (event: {
  data: {
    type: string;
    payload: any;
  }
}) => {
  // Handle incoming messages
  if (event.data.type === "lyapunov" && typeof event.data.payload === "string"){
    const attractor = buildAttractorFromString(event.data.payload);
    const simulator = new LyapunovSimulator(attractor, [0.1, 0.1]);
    const array = new Float32Array(40_000_000 * 2);
    for (let i = 2; i < array.length; i += 2) {
      const next = simulator.step();
      array[i] = next[0];
      array[i + 1] = next[1];
    }

    self.postMessage({ type: "RESULT", data: {
      points: array,
      bounds: simulator.bounds
    }});
  }
});