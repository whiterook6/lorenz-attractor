import { LyapunovScene } from "./scenes/lyapunov";

const run = async () => {
  const scene = new LyapunovScene();

  return scene.run();
};

run();
