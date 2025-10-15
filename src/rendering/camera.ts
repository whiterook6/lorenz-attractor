import { Point3 } from "../types";

export type Bounds = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  scale: number;
  offsetX: number;
  offsetY: number;
};

export class Camera {
  isDragging = false;
  lastX = 0;
  lastY = 0;
  offsetX = 0;
  offsetY = 0;
  scale = 1;
  callbacks: Array<() => void> = [];

  public onChange(callback: () => void) {
    this.callbacks.push(callback);
  }

  constructor() {
    this.mouseDown = this.mouseDown.bind(this);
    this.mouseMove = this.mouseMove.bind(this);
    this.mouseUp = this.mouseUp.bind(this);
    this.wheel = this.wheel.bind(this);
  }

  public enable() {
    window.addEventListener("mousedown", this.mouseDown);
    window.addEventListener("mousemove", this.mouseMove);
    window.addEventListener("mouseup", this.mouseUp);
    window.addEventListener("wheel", this.wheel, { passive: false });
  }

  public disable() {
    window.removeEventListener("mousedown", this.mouseDown);
    window.removeEventListener("mousemove", this.mouseMove);
    window.removeEventListener("mouseup", this.mouseUp);
    window.removeEventListener("wheel", this.wheel);
  }

  public fitBounds(
    bounds: {
      left: number;
      right: number;
      top: number;
      bottom: number;
    },
    canvasCssWidth: number,
    canvasCssHeight: number
  ) {
    // Add a margin of 32px on all sides
    const margin = 32;
    const boundsWidth = bounds.right - bounds.left;
    const boundsHeight = bounds.bottom - bounds.top;
    const scale = Math.min(
      (canvasCssWidth - 2 * margin) / boundsWidth,
      (canvasCssHeight - 2 * margin) / boundsHeight
    );

    // setup camera so bounds are centered with margin
    this.scale = Math.max(0, scale);
    this.offsetX = margin + (canvasCssWidth - 2 * margin) / 2 - scale * (bounds.left + boundsWidth / 2);
    this.offsetY = margin + (canvasCssHeight - 2 * margin) / 2 - scale * (bounds.top + boundsHeight / 2);
  }

  public mouseDown = (event: MouseEvent) => {
    this.isDragging = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
  };

  public mouseMove = (event: MouseEvent) => {
    if (this.isDragging) {
      const dx = event.clientX - this.lastX;
      const dy = event.clientY - this.lastY;
      this.offsetX += dx;
      this.offsetY += dy;
      this.lastX = event.clientX;
      this.lastY = event.clientY;
      this.callbacks.forEach((cb) => cb());
    }
  };

  public mouseUp = (_event: MouseEvent) => {
    this.isDragging = false;
  };

  public wheel = (event: WheelEvent) => {
    event.preventDefault();
    const zoomFactor = 1.1;
    const mouseX = event.offsetX;
    const mouseY = event.offsetY;
    const direction = event.deltaY < 0 ? 1 : -1;
    const factor = direction > 0 ? zoomFactor : 1 / zoomFactor;

    // Adjust offset so zoom centers on mouse
    this.offsetX = mouseX - factor * (mouseX - this.offsetX);
    this.offsetY = mouseY - factor * (mouseY - this.offsetY);

    this.scale *= factor;
    this.callbacks.forEach((cb) => cb());
  };

  public transform = (point: Point3): [number, number] => {
    const [x, y] = point;
    const xScreen = x * this.scale + this.offsetX;
    const yScreen = y * this.scale + this.offsetY;
    return [xScreen, yScreen];
  };

  public getBounds = (canvasWidth: number, canvasHeight: number): Bounds => {
    const left = -this.offsetX / this.scale;
    const right = (canvasWidth - this.offsetX) / this.scale;
    const top = -this.offsetY / this.scale;
    const bottom = (canvasHeight - this.offsetY) / this.scale;
    return {
      left,
      right,
      top,
      bottom,
      scale: this.scale,
      offsetX: this.offsetX,
      offsetY: this.offsetY,
    };
  };
}
