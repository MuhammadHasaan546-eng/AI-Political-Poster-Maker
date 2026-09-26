import { drawMotifs } from "./motifs";
import type { LayerSettings, LayoutConfig, PhotoSlot, PosterFormData, TextSlot } from "./types";

/* ------------------------------- Inputs ------------------------------- */

export interface RenderInput {
  layout: LayoutConfig;
  formData: PosterFormData;
  /** Photo sources aligned index-for-index with `layout.photoSlots`. */
  photos?: (string | null)[];
  settings?: LayerSettings;
}

const DEFAULT_SETTINGS: LayerSettings = {
  photoScale: 1,
  photoOffsetY: 0,
  fontFamily: "",
  showMotifs: true,
  showFooterBar: true,
  headlineColor: "",
};

/* ---------------------------- Photo loading ---------------------------- */

const imageCache = new Map<string, HTMLImageElement>();
const MAX_EXPORT_EDGE = 3600;

function loadImage(src: string): Promise<HTMLImageElement | null> {
  const cached = imageCache.get(src);
  if (cached?.complete && cached.naturalWidth > 0) {
    return Promise.resolve(cached);
  }

  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    const timer = window.setTimeout(() => resolve(null), 4000);

    image.onload = () => {
      window.clearTimeout(timer);
      imageCache.set(src, image);
      resolve(image);
    };
    image.onerror = () => {
      window.clearTimeout(timer);
      resolve(null);
    };
    image.src = src;
  });
}

/** Preload every photo so the first paint is not blank. */
export async function preloadPhotos(sources: (string | null | undefined)[]): Promise<void> {
  await Promise.all(
    sources.filter((src): src is string => Boolean(src)).map((src) => loadImage(src)),
  );
}

/* ------------------------------ Text helpers ------------------------------ */

/** Resolve the display string for a text slot key from the form data. */
export function resolveTextValue(
  key: TextSlot["key"],
  formData: PosterFormData,
): string {
  switch (key) {
    case "headline":
      return formData.headline;
    case "subheadline":
      return formData.organization || formData.partyName;
    case "designation":
      return [formData.name, formData.designation].filter(Boolean).join(" — ");
    default:
      return "";
  }
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];

  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }

    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth || !current) {
        // Break a single word that cannot fit on its own line.
        if (!current && ctx.measureText(word).width > maxWidth) {
          let chunk = "";
          for (const char of Array.from(word)) {
            if (ctx.measureText(chunk + char).width > maxWidth && chunk) {
              lines.push(chunk);
              chunk = char;
            } else {
              chunk += char;
            }
          }
          current = chunk;
          continue;
        }
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
  }

  return lines;
}

function buildFont(slot: TextSlot, family: string): string {
  const weight = slot.key === "headline" ? 800 : 600;
  const safeFamily = family || slot.fontFamily;
  return `${weight} ${slot.fontSize}px "${safeFamily}", "Hind Siliguri", "Noto Serif Bengali", system-ui, sans-serif`;
}

/* ------------------------------ Slot paths ------------------------------ */

function slotPath(ctx: CanvasRenderingContext2D, slot: PhotoSlot): void {
  const { x, y, w, h, shape } = slot;
  ctx.beginPath();

  if (shape === "circle") {
    const radius = Math.min(w, h) / 2;
    ctx.arc(x + w / 2, y + h / 2, radius, 0, Math.PI * 2);
    return;
  }

  if (shape === "arch") {
    const radius = w / 2;
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + radius);
    ctx.arc(x + radius, y + radius, radius, Math.PI, 0);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    return;
  }

  ctx.rect(x, y, w, h);
}

function drawPlaceholder(ctx: CanvasRenderingContext2D, slot: PhotoSlot): void {
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.font = `600 ${Math.round(slot.w * 0.09)}px "Hind Siliguri", system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Add Photo", slot.x + slot.w / 2, slot.y + slot.h / 2);
  ctx.restore();
}

/* ------------------------------ Main render ------------------------------ */

/**
 * Draws a complete poster onto a 2D context.
 * Text is rendered as real font glyphs (never baked into an image), which is
 * what keeps Bangla conjuncts intact in the exported PNG.
 */
export async function renderPoster(
  ctx: CanvasRenderingContext2D,
  input: RenderInput,
): Promise<void> {
  const settings = { ...DEFAULT_SETTINGS, ...input.settings };
  const { layout, formData } = input;
  const { w, h } = layout.canvas;

  ctx.clearRect(0, 0, w, h);
  ctx.save();

  /* Background */
  const colors = layout.background.colors.length
    ? layout.background.colors
    : ["#006A4E", "#0D1117"];
  const gradient = ctx.createLinearGradient(0, 0, w, h);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(0.55, colors[1] ?? colors[0]);
  gradient.addColorStop(1, colors[colors.length - 1] ?? "#0D1117");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  /* Motifs */
  const accent = colors[1] ?? "#FFC107";
  if (settings.showMotifs && layout.background.motifIds.length > 0) {
    drawMotifs(ctx, layout.background.motifIds, {
      width: w,
      height: h,
      accent: "#FFC107",
      accentSoft: accent,
    });
  }

  /* Photo slots */
  const photos = input.photos ?? [];
  for (let index = 0; index < layout.photoSlots.length; index += 1) {
    const base = layout.photoSlots[index];
    const scale = settings.photoScale || 1;
    const scaled: PhotoSlot = {
      ...base,
      x: base.x + (base.w * (1 - scale)) / 2,
      y: base.y + (base.h * (1 - scale)) / 2 + settings.photoOffsetY,
      w: base.w * scale,
      h: base.h * scale,
    };

    const source = photos[index] ?? null;
    const image = source ? await loadImage(source) : null;

    ctx.save();
    slotPath(ctx, scaled);
    if (image) {
      ctx.clip();
      // Cover-fit while preserving aspect ratio.
      const ratio = Math.max(scaled.w / image.width, scaled.h / image.height);
      const drawW = image.width * ratio;
      const drawH = image.height * ratio;
      ctx.drawImage(
        image,
        scaled.x + (scaled.w - drawW) / 2,
        scaled.y + (scaled.h - drawH) / 2,
        drawW,
        drawH,
      );
      ctx.restore();
    } else {
      drawPlaceholder(ctx, scaled);
      ctx.restore();
    }

    // Gold/brand border ring on top of the photo.
    ctx.save();
    slotPath(ctx, scaled);
    ctx.strokeStyle = base.borderColor || "#FFC107";
    ctx.lineWidth = base.borderWidth || 10;
    ctx.stroke();
    ctx.restore();
  }

  /* Text slots */
  for (const slot of layout.textSlots) {
    const value = resolveTextValue(slot.key, formData).trim();
    if (!value) continue;

    ctx.save();
    ctx.font = buildFont(slot, settings.fontFamily);
    ctx.textBaseline = "top";
    ctx.textAlign = slot.align;
    ctx.fillStyle =
      slot.key === "headline" && settings.headlineColor
        ? settings.headlineColor
        : slot.color;

    const lines = wrapText(ctx, value, slot.maxWidth);
    const lineHeight = slot.fontSize * (slot.lineHeight || 1.2);
    const anchorX =
      slot.align === "center"
        ? slot.x
        : slot.align === "right"
          ? slot.x + slot.maxWidth / 2
          : slot.x - slot.maxWidth / 2;

    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = slot.key === "headline" ? 14 : 8;
    ctx.shadowOffsetY = 3;

    lines.forEach((line, lineIndex) => {
      ctx.fillText(line, anchorX, slot.y + lineIndex * lineHeight);
    });
    ctx.restore();
  }

  /* Footer credit bar */
  if (settings.showFooterBar) {
    const footer = layout.footerBar;
    ctx.save();
    ctx.fillStyle = footer.bg;
    ctx.fillRect(0, footer.y, w, footer.h + (h - (footer.y + footer.h)));

    const credits = [
      formData.organization,
      formData.unionThanaJela,
      formData.partyName,
      formData.promoteBy,
    ]
      .filter(Boolean)
      .join(" • ");

    ctx.fillStyle = footer.textColor;
    ctx.font = `600 ${Math.round(footer.h * 0.26)}px "Hind Siliguri", system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(credits || "Promoted by — Sonar Bangla Poster AI", w / 2, footer.y + footer.h / 2);
    ctx.restore();
  }

  ctx.restore();
}

/* ------------------------------- Exporters ------------------------------- */

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/** Render to an offscreen canvas at a capped export scale. */
export async function renderToOffscreenCanvas(input: RenderInput): Promise<HTMLCanvasElement> {
  const { w, h } = input.layout.canvas;
  const scale = Math.min(2, MAX_EXPORT_EDGE / Math.max(w, h));
  const canvas = createCanvas(Math.round(w * scale), Math.round(h * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.scale(scale, scale);
  await renderPoster(ctx, input);
  return canvas;
}

/** Produce a high-resolution PNG data URL of the poster. */
export async function renderPosterToDataUrl(input: RenderInput): Promise<string> {
  const canvas = await renderToOffscreenCanvas(input);
  return canvas.toDataURL("image/png");
}

/** Download the poster as a PNG file. */
export async function downloadPosterPng(
  input: RenderInput,
  filename = "sonar-bangla-poster.png",
): Promise<void> {
  const dataUrl = await renderPosterToDataUrl(input);
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * PDF export via the browser print dialog (zero extra bundle weight).
 * Prints a single full-bleed page sized to the poster aspect ratio.
 */
export async function printPosterAsPdf(input: RenderInput): Promise<void> {
  const dataUrl = await renderPosterToDataUrl(input);
  const { w, h } = input.layout.canvas;
  const win = window.open("", "_blank", "width=900,height=1200");
  if (!win) return;

  const orientation = w > h ? "landscape" : "portrait";
  win.document.write(`<!doctype html><html><head><title>Poster</title>
    <style>
      @page { size: ${w}px ${h}px; margin: 0; }
      html, body { margin: 0; padding: 0; background: #fff; }
      img { width: 100%; height: auto; display: block; }
    </style></head>
    <body><img src="${dataUrl}" alt="Poster" /></body></html>`);
  win.document.close();
  win.focus();
  void orientation;
  window.setTimeout(() => win.print(), 400);
}
