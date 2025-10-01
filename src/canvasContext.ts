export const getCanvas = (id: string): HTMLCanvasElement => {
  const canvas = document.getElementById(id) as HTMLCanvasElement;
  if (!canvas) {
    throw new Error("Cannot get canvas");
  }
  return canvas;
};

export const getCanvasContext = (
  canvas: HTMLCanvasElement
): CanvasRenderingContext2D => {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Cannot get canvas context");
  }
  return ctx;
};
