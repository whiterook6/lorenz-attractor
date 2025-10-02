export function generateAttractor(options: {
  maxIterations: number,
  drawThresholdStart: number,
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D
}) {
  const MAX_ITERATIONS = options.maxIterations ?? 100000; // change if heavy for your browser
  const DRAW_THRESHOLD_START = options.drawThresholdStart ?? 100; // mimic C's i > 100

  // Helper aliases
  const ABS = Math.abs;
  const MIN = Math.min;
  const MAX = Math.max;
  const SQRT = Math.sqrt;
  const LOG = Math.log;

  // allocate arrays
  const x = new Array<number>(MAX_ITERATIONS);
  const y = new Array<number>(MAX_ITERATIONS);

  // generate random coefficients ax[0..5], ay[0..5] in range [-2, 2] (same scaling as 4*(drand48()-0.5))
  const ax = new Array<number>(6), ay = new Array<number>(6);
  for (let i = 0; i < 6; i++) {
    ax[i] = 2 * (Math.random() - 0.5);
    ay[i] = 2 * (Math.random() - 0.5);
  }

  // initial conditions
  x[0] = Math.random() - 0.5;
  y[0] = Math.random() - 0.5;

  // pick a nearby point (xe, ye) so initial distance d0 > 0
  let xe = x[0], ye = y[0], d0 = 0;
  while (d0 === 0) {
    xe = x[0] + (Math.random() - 0.5) / 1000;
    ye = y[0] + (Math.random() - 0.5) / 1000;
    const dx = x[0] - xe;
    const dy = y[0] - ye;
    d0 = Math.sqrt(dx * dx + dy * dy);
  }

  let xmin = Number.POSITIVE_INFINITY,
      xmax = Number.NEGATIVE_INFINITY,
      ymin = Number.POSITIVE_INFINITY,
      ymax = Number.NEGATIVE_INFINITY;

  let drawit = true;
  let lyapunov = 0;

  for (let i = 1; i < MAX_ITERATIONS; i++) {
    // map update (quadratic polynomial in previous x,y)
    const xp = x[i - 1], yp = y[i - 1];
    x[i] = ax[0] + ax[1] * xp + ax[2] * xp * xp + ax[3] * xp * yp + ax[4] * yp + ax[5] * yp * yp;
    y[i] = ay[0] + ay[1] * xp + ay[2] * xp * xp + ay[3] * xp * yp + ay[4] * yp + ay[5] * yp * yp;

    // the nearby trajectory (xe,ye) one step
    const xenew = ax[0] + ax[1] * xe + ax[2] * xe * xe + ax[3] * xe * ye + ax[4] * ye + ax[5] * ye * ye;
    const yenew = ay[0] + ay[1] * xe + ay[2] * xe * xe + ay[3] * xe * ye + ay[4] * ye + ay[5] * ye * ye;

    // update bounds
    xmin = MIN(xmin, x[i]);
    ymin = MIN(ymin, y[i]);
    xmax = MAX(xmax, x[i]);
    ymax = MAX(ymax, y[i]);

    // divergence to infinity?
    if (xmin < -1e10 || ymin < -1e10 || xmax > 1e10 || ymax > 1e10) {
      drawit = false;
      // classification: infinite attractor
      return {
        classification: 'infinite',
        reason: 'bounds exceeded',
        ax, ay, x, y, xmin, xmax, ymin, ymax, lyapunov
      };
    }

    // convergence to point?
    let dx = x[i] - x[i - 1];
    let dy = y[i] - y[i - 1];
    if (ABS(dx) < 1e-10 && ABS(dy) < 1e-10) {
      drawit = false;
      return {
        classification: 'point',
        reason: 'converged to point',
        ax, ay, x, y, xmin, xmax, ymin, ymax, lyapunov
      };
    }

    // Lyapunov calculation (start accumulating after a transient)
    if (i > 1000) { // same threshold as the original C code
      dx = x[i] - xenew;
      dy = y[i] - yenew;
      const dd = SQRT(dx * dx + dy * dy);

      if (dd === 0) {
        // extremely unlikely; treat as non-chaotic / skip
        drawit = false;
        return {
          classification: 'degenerate',
          reason: 'zero separation in lyapunov step',
          ax, ay, x, y, xmin, xmax, ymin, ymax, lyapunov
        };
      }

      lyapunov += LOG(ABS(dd / d0)); // accumulate log of stretching
      // renormalize nearby point to distance d0 along direction of difference
      xe = x[i] + d0 * dx / dd;
      ye = y[i] + d0 * dy / dd;
    } else {
      // update the nearby orbit normally for earlier i so that xe,ye remain in sync:
      xe = xenew;
      ye = yenew;
    }
  } // end iterations

  // classification based on lyapunov (mimic C logic)
  if (drawit) {
    if (ABS(lyapunov) < 10) {
      drawit = false;
      return {
        classification: 'neutrally stable',
        lyapunov,
        ax, ay, x, y, xmin, xmax, ymin, ymax
      };
    } else if (lyapunov < 0) {
      drawit = false;
      return {
        classification: 'periodic',
        lyapunov,
        ax, ay, x, y, xmin, xmax, ymin, ymax
      };
    } else {
      // chaotic
      const result = {
        classification: 'chaotic',
        lyapunov,
        ax, ay, x, y, xmin, xmax, ymin, ymax
      };

      // if a canvas/context was provided, draw now
      drawAttractor(options.context, x, y, xmin, xmax, ymin, ymax, DRAW_THRESHOLD_START);

      return result;
    }
  }

  // fallback: shouldn't get here
  return {
    classification: 'unknown',
    lyapunov,
    ax, ay, x, y, xmin, xmax, ymin, ymax
  };
}

/**
 * Example drawAttractor(ctx, x, y, xmin, xmax, ymin, ymax, skipFirst)
 * - A simple density-like point plot on an HTMLCanvas 2D context.
 * - Does not do advanced color ramps or alpha accumulation; replace as needed.
 */
export function drawAttractor(ctx: CanvasRenderingContext2D, xArr: number[], yArr: number[], xmin: number, xmax: number, ymin: number, ymax: number, skipFirst = 100) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  // Clear canvas (white)
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);

  // Draw points; to emulate the C program (black pixels, skip initial transient)
  ctx.fillStyle = 'black';

  // To avoid drawing off-canvas when bounds degenerate, ensure denominators are safe:
  const xRange = (xmax === xmin) ? 1e-6 : (xmax - xmin);
  const yRange = (ymax === ymin) ? 1e-6 : (ymax - ymin);

  // Simple plotting - because there could be many points, use single-pixel rectangles
  for (let i = skipFirst + 1; i < xArr.length; i++) {
    const xv = xArr[i], yv = yArr[i];
    // skip NaN/Infinity
    if (!isFinite(xv) || !isFinite(yv)) continue;

    const ix = Math.floor(width * (xv - xmin) / xRange);
    const iy = Math.floor(height * (yv - ymin) / yRange);

    // small bounds guard:
    if (ix < 0 || ix >= width || iy < 0 || iy >= height) continue;

    // Draw a 1x1 pixel rectangle
    ctx.fillRect(ix, height - 1 - iy, 1, 1); // flip Y so lower values are at bottom
  }
}

/* -------------------------
 Example usage in browser:
 -------------------------
 <canvas id="c" width="600" height="600"></canvas>
 <script>
   // (paste the code above here)
   const canvas = document.getElementById('c');
   // keep iterations modest while experimenting:
   const result = generateAttractor({ maxIterations: 80000, canvas, drawThresholdStart: 100 });
   console.log('result:', result.classification, 'lyapunov=', result.lyapunov);
 </script>
 ------------------------- */

