import { Point3 } from "../types";

export type Bounds = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
};

export class Camera {
  isDragging = false;
  lastX = 0;
  lastY = 0;
  offsetX = 0;
  offsetY = 0;
  scaleX = 1;
  scaleY = 1;
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

  /**
   * Stretches the bounds to fill the canvas, ignoring aspect ratio, with margin.
   */
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
    // Stretch to fill canvas (ignore aspect ratio)
    const scaleX = (canvasCssWidth - 2 * margin) / boundsWidth;
    const scaleY = (canvasCssHeight - 2 * margin) / boundsHeight;

    this.scaleX = Math.max(0, scaleX);
    this.scaleY = Math.max(0, scaleY);

    // Center the bounds in the canvas
    this.offsetX = margin + (canvasCssWidth - 2 * margin) / 2 - this.scaleX * (bounds.left + boundsWidth / 2);
    this.offsetY = margin + (canvasCssHeight - 2 * margin) / 2 - this.scaleY * (bounds.top + boundsHeight / 2);
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

    this.scaleX *= factor;
    this.scaleY *= factor;
    this.callbacks.forEach((cb) => cb());
  };

  /**
   * Transforms a point in world coordinates to screen coordinates,
   * stretching X and Y independently.
   */
  public transform = (point: Point3): [number, number] => {
    const [x, y] = point;
    const xScreen = x * this.scaleX + this.offsetX;
    const yScreen = y * this.scaleY + this.offsetY;
    return [xScreen, yScreen];
  };

  public getBounds = (canvasWidth: number, canvasHeight: number): Bounds => {
    const left = -this.offsetX / this.scaleX;
    const right = (canvasWidth - this.offsetX) / this.scaleX;
    const top = -this.offsetY / this.scaleY;
    const bottom = (canvasHeight - this.offsetY) / this.scaleY;
    return {
      left,
      right,
      top,
      bottom,
      scaleX: this.scaleX,
      scaleY: this.scaleY,
      offsetX: this.offsetX,
      offsetY: this.offsetY,
    };
  };
}
