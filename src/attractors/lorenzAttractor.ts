import { Point3 } from "../types";

export class LorenzAttractor {
  sigma: number = 10;
  rho: number = 28;
  beta: number = 8 / 3;

  public derivative = (x: number, y: number, z: number): Point3 => [
    this.sigma * (y - x),
    x * (this.rho - z) - y,
    x * y - this.beta * z,
  ];

  public step = ([x, y, z]: Point3, dt: number): Point3 => {
    const [k1dx, k1dy, k1dz] = this.derivative(x, y, z);
    const [k2dx, k2dy, k2dz] = this.derivative(
      x + 0.5 * dt * k1dx,
      y + 0.5 * dt * k1dy,
      z + 0.5 * dt * k1dz
    );
    const [k3dx, k3dy, k3dz] = this.derivative(
      x + 0.5 * dt * k2dx,
      y + 0.5 * dt * k2dy,
      z + 0.5 * dt * k2dz
    );
    const [k4dx, k4dy, k4dz] = this.derivative(
      x + dt * k3dx,
      y + dt * k3dy,
      z + dt * k3dz
    );

    const xNext = x + (dt / 6) * (k1dx + 2 * k2dx + 2 * k3dx + k4dx);
    const yNext = y + (dt / 6) * (k1dy + 2 * k2dy + 2 * k3dy + k4dy);
    const zNext = z + (dt / 6) * (k1dz + 2 * k2dz + 2 * k3dz + k4dz);

    return [xNext, yNext, zNext];
  };

  public getTimestep = ([x, y, z]: Point3, stepSize: number): number => {
    const [dx, dy, dz] = this.derivative(x, y, z);
    const magnitude = Math.sqrt(dx * dx + dy * dy + dz * dz);
    return stepSize / magnitude;
  };
}
