/**
 * Procedural decorations drawn directly onto the poster canvas.
 * Motifs are vector-drawn (not images) so exports stay crisp at any DPI.
 */

export type MotifId =
  | "flag"
  | "star"
  | "crescent"
  | "paddy"
  | "dove"
  | "floral";

export interface MotifContext {
  width: number;
  height: number;
  accent: string;
  accentSoft: string;
}

/** Five-pointed star path. */
function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  points = 5,
): void {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI / points) * i - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/** Simplified flag: field + disc, offset into a corner. */
function drawFlag(ctx: CanvasRenderingContext2D, c: MotifContext, x: number, y: number, size: number) {
  ctx.save();
  ctx.fillStyle = "#006A4E";
  ctx.fillRect(x, y, size, size * 0.62);
  ctx.beginPath();
  ctx.arc(x + size * 0.4, y + size * 0.31, size * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = "#F42A41";
  ctx.fill();
  ctx.restore();
  void c;
}

/** Wheat/paddy stalk — agricultural prosperity motif. */
function drawPaddy(
  ctx: CanvasRenderingContext2D,
  c: MotifContext,
  x: number,
  y: number,
  size: number,
) {
  ctx.save();
  ctx.strokeStyle = c.accent;
  ctx.fillStyle = c.accent;
  ctx.lineWidth = size * 0.035;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(x, y + size);
  ctx.quadraticCurveTo(x - size * 0.1, y + size * 0.5, x, y);
  ctx.stroke();

  for (let i = 0; i < 5; i += 1) {
    const t = 0.18 + i * 0.16;
    const py = y + size * t;
    const grain = size * 0.14;
    ctx.beginPath();
    ctx.ellipse(x - grain * 0.9, py, grain, grain * 0.45, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + grain * 0.9, py, grain, grain * 0.45, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Dove of peace — used by tribute templates. */
function drawDove(
  ctx: CanvasRenderingContext2D,
  c: MotifContext,
  x: number,
  y: number,
  size: number,
) {
  ctx.save();
  ctx.fillStyle = c.accentSoft;
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.55);
  ctx.quadraticCurveTo(x + size * 0.32, y + size * 0.1, x + size * 0.72, y + size * 0.28);
  ctx.quadraticCurveTo(x + size * 0.5, y + size * 0.42, x + size * 0.4, y + size * 0.62);
  ctx.quadraticCurveTo(x + size * 0.24, y + size * 0.8, x, y + size * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Crescent + star — festival motif. */
function drawCrescent(
  ctx: CanvasRenderingContext2D,
  c: MotifContext,
  x: number,
  y: number,
  size: number,
) {
  ctx.save();
  ctx.fillStyle = c.accent;
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(x + size / 2 + size * 0.18, y + size / 2, size * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
  drawStar(ctx, x + size * 0.78, y + size * 0.32, size * 0.16, size * 0.07, 5);
  ctx.fillStyle = c.accent;
  ctx.fill();
  ctx.restore();
}

/** Decorative flower — generic celebratory motif. */
function drawFloral(
  ctx: CanvasRenderingContext2D,
  c: MotifContext,
  x: number,
  y: number,
  size: number,
) {
  ctx.save();
  const petals = 8;
  const cx = x + size / 2;
  const cy = y + size / 2;
  ctx.fillStyle = c.accentSoft;
  for (let i = 0; i < petals; i += 1) {
    const angle = (Math.PI * 2 * i) / petals;
    ctx.beginPath();
    ctx.ellipse(
      cx + Math.cos(angle) * size * 0.26,
      cy + Math.sin(angle) * size * 0.26,
      size * 0.16,
      size * 0.08,
      angle,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.1, 0, Math.PI * 2);
  ctx.fillStyle = c.accent;
  ctx.fill();
  ctx.restore();
}

const CORNERS = ["tl", "tr", "bl", "br"] as const;

/** Draws the requested motifs as balanced corner ornaments. */
export function drawMotifs(
  ctx: CanvasRenderingContext2D,
  motifIds: string[],
  context: MotifContext,
): void {
  const { width, height } = context;
  const size = Math.min(width, height) * 0.11;
  const pad = Math.min(width, height) * 0.035;

  motifIds.slice(0, 4).forEach((id, index) => {
    const corner = CORNERS[index % CORNERS.length];
    const x = corner.includes("l") ? pad : width - pad - size;
    const y = corner.startsWith("b") ? height - pad - size : pad;

    switch (id) {
      case "flag":
        drawFlag(ctx, context, x, y, size);
        break;
      case "star":
        ctx.save();
        ctx.fillStyle = context.accent;
        drawStar(ctx, x + size / 2, y + size / 2, size / 2, size / 5);
        ctx.fill();
        ctx.restore();
        break;
      case "crescent":
        drawCrescent(ctx, context, x, y, size);
        break;
      case "paddy":
        drawPaddy(ctx, context, x + size / 2, y, size);
        break;
      case "dove":
        drawDove(ctx, context, x, y, size);
        break;
      case "floral":
        drawFloral(ctx, context, x, y, size);
        break;
      default:
        break;
    }
  });
}
