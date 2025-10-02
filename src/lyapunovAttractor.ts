import { Point2 } from "./types";

export const buildRandomLyapyunovAttractor = () => {
  const xCoefficients = new Array<number>(6)
    .fill(0)
    .map(() => 2 * (Math.random() - 0.5)) as [
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  const yCoefficients = new Array<number>(6)
    .fill(0)
    .map(() => 2 * (Math.random() - 0.5)) as [
    number,
    number,
    number,
    number,
    number,
    number,
  ];

  return buildLyapunovAttractor(xCoefficients, yCoefficients);
};

export const buildLyapunovAttractor = (
  xCoefficients: [number, number, number, number, number, number],
  yCoefficients: [number, number, number, number, number, number]
) => {
  const fn = (point: Point2): Point2 => {
    const [a0, a1, a2, a3, a4, a5] = xCoefficients;
    const [b0, b1, b2, b3, b4, b5] = yCoefficients;
    const [x, y] = point;

    const x2 = x * x;
    const xy = x * y;
    const y2 = y * y;

    return [
      a0 + a1 * x + a2 * x2 + a3 * xy + a4 * y + a5 * y2,
      b0 + b1 * x + b2 * x2 + b3 * xy + b4 * y + b5 * y2,
    ];
  };
  fn.toString = () => {
    return JSON.stringify({
      a: xCoefficients,
      b: yCoefficients,
    });
  };
  return fn;
};

export class LyapunovSimulator {
  private map: (point: Point2) => Point2;
  private currentPoint: Point2;
  private previousPoint: Point2;
  private nearbyPoint: Point2;
  private initialDistance: number;
  private lyapunovSum: number = 0;
  private iterations: number = 0;

  static WARMUP = 1000; // Number of iterations before computing Lyapunov
  static MAX_COORD = 1e10; // Bailout threshold for divergent orbits
  static EPS = 1e-20; // Minimum distance for safe division/log

  public bounds = {
    xmin: Number.POSITIVE_INFINITY,
    xmax: Number.NEGATIVE_INFINITY,
    ymin: Number.POSITIVE_INFINITY,
    ymax: Number.NEGATIVE_INFINITY,
  };

  constructor(map: (point: Point2) => Point2, initialPoint: Point2) {
    this.map = map;
    this.currentPoint = [...initialPoint];
    this.previousPoint = [...initialPoint];
    this.nearbyPoint = [initialPoint[0] + 1e-4, initialPoint[1] + 1e-4];

    const dx = this.currentPoint[0] - this.nearbyPoint[0];
    const dy = this.currentPoint[1] - this.nearbyPoint[1];
    this.initialDistance = Math.sqrt(dx * dx + dy * dy);
  }

  step(): Point2 {
    this.previousPoint = [...this.currentPoint];

    // Advance main and shadow points
    this.currentPoint = this.map(this.currentPoint);
    this.nearbyPoint = this.map(this.nearbyPoint);
    this.iterations += 1;

    // Bailout if coordinates are non-finite or too large
    for (const coord of [...this.currentPoint, ...this.nearbyPoint]) {
      if (
        !Number.isFinite(coord) ||
        Math.abs(coord) > LyapunovSimulator.MAX_COORD
      ) {
        return this.previousPoint;
      }
    }

    // Update bounds
    this.bounds.xmin = Math.min(this.bounds.xmin, this.currentPoint[0]);
    this.bounds.xmax = Math.max(this.bounds.xmax, this.currentPoint[0]);
    this.bounds.ymin = Math.min(this.bounds.ymin, this.currentPoint[1]);
    this.bounds.ymax = Math.max(this.bounds.ymax, this.currentPoint[1]);

    // Only start computing Lyapunov after warmup
    if (this.iterations <= LyapunovSimulator.WARMUP) {
      return this.currentPoint;
    }

    // Compute distance between main point and nearby point
    let dx = this.currentPoint[0] - this.nearbyPoint[0];
    let dy = this.currentPoint[1] - this.nearbyPoint[1];
    let currentDistance = Math.sqrt(dx * dx + dy * dy);
    currentDistance = Math.max(currentDistance, LyapunovSimulator.EPS); // prevent log(0)

    // Increment Lyapunov sum
    const lyapunovIncrement = Math.log(currentDistance / this.initialDistance);
    this.lyapunovSum += lyapunovIncrement;

    // Rescale shadow point to maintain initial distance
    const scale = this.initialDistance / currentDistance;
    this.nearbyPoint = [
      this.currentPoint[0] + dx * scale,
      this.currentPoint[1] + dy * scale,
    ];

    return this.currentPoint;
  }

  getLyapunovExponent(): number {
    const effectiveSteps = Math.max(
      0,
      this.iterations - LyapunovSimulator.WARMUP
    );
    return effectiveSteps > 0 ? this.lyapunovSum / effectiveSteps : 0;
  }

  getClassification():
    | "chaotic"
    | "stable"
    | "unknown"
    | "convergent"
    | "divergent"
    | "periodic" {
    // Hard bailout: divergent
    if (
      this.bounds.xmin < -LyapunovSimulator.MAX_COORD ||
      this.bounds.ymin < -LyapunovSimulator.MAX_COORD ||
      this.bounds.xmax > LyapunovSimulator.MAX_COORD ||
      this.bounds.ymax > LyapunovSimulator.MAX_COORD
    ) {
      return "divergent";
    }

    // Hard bailout: collapsed to fixed point
    const dx = this.currentPoint[0] - this.previousPoint[0];
    const dy = this.currentPoint[1] - this.previousPoint[1];
    if (Math.abs(dx) < 1e-10 && Math.abs(dy) < 1e-10) {
      return "convergent";
    }

    const exponent = this.getLyapunovExponent();
    if (exponent < -10) {
      return "periodic";
    } else if (exponent < 10) {
      return "stable";
    } else {
      return "chaotic";
    }
  }
}
