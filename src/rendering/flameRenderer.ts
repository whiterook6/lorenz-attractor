export class FlameRenderer {
  static getColor = (t: number): [number, number, number] => {
    if (t < 0.5) {
      // dark orange → yellow
      const f = t / 0.5;
      return [255, Math.floor(100 + 155 * f), 0];
    } else {
      // yellow → white
      const f = (t - 0.5) / 0.5;
      return [255, 255, Math.floor(0 + 255 * f)];
    }
  };

  static render = (pixelDensities: Float32Array, imageData: ImageData) => {
    imageData.data.fill(1); // clear to white

    let maxDensity = 0;
    for (let i = 0; i < pixelDensities.length; i++) {
      if (pixelDensities[i] > maxDensity) {
        maxDensity = pixelDensities[i];
      }
    }

    for (let i = 0; i < pixelDensities.length; i++) {
      const density = pixelDensities[i];
      if (density > 0) {
        const [r, g, b] = FlameRenderer.getColor(
          Math.pow(density / maxDensity, 0.5)
        );
        imageData.data[i * 4] = r; // R
        imageData.data[i * 4 + 1] = g; // G
        imageData.data[i * 4 + 2] = b; // B
        imageData.data[i * 4 + 3] = 255; // A
      }
    }

    return imageData;
  };
}
