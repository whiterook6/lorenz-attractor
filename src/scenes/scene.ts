import { getCanvas, getCanvasContext } from "../canvasContext";

export abstract class Scene {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;

  constructor() {
    this.canvas = getCanvas("myCanvas");
    if (!this.canvas) {
      throw new Error("Canvas element not found");
    }

    this.context = getCanvasContext(this.canvas);
    this.resizeCanvas = this.resizeCanvas.bind(this);
    this.resizeCanvas();
  }

  run = () => {
    this._run(this.canvas, this.context);
  };

  watchForResize = () => {
    window.addEventListener("resize", this.resizeCanvas);
  };

  abstract _run(
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D
  ): void;

  private resizeCanvas = () => {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = window.innerWidth + "px";
    this.canvas.style.height = window.innerHeight + "px";
    this.context.setTransform(dpr, 0, 0, dpr, 0, 0); // scale all drawing
  };
}
