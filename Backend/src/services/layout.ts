import type { LayoutConfig, PhotoSlot, TextSlot } from '../types/layout';
import { motifSvg } from './motifs';

/**
 * Server-side HTML poster renderer.
 *
 * Turns a data-driven {@link LayoutConfig} plus user form input into a single
 * self-contained HTML document laid out at exactly 1200x1600 CSS pixels. The
 * render pipeline screenshots this document with a 2x device scale factor to
 * produce a print-ready 2400x3200 PNG.
 *
 * Bangla text is rendered as real HTML glyphs (not drawn to a bitmap), so
 * conjuncts shape correctly via the system font stack.
 */

/** Poster form fields available to the renderer. */
export interface PosterForm {
  occasionType: string;
  headline: string;
  name: string;
  designation: string;
  organization?: string;
  unionThanaJela?: string;
  partyName?: string;
  promoteBy?: string;
}

/** Optional live-tuning overrides applied on top of the template layout. */
export interface RenderOverrides {
  fontFamily?: string;
  showMotifs?: boolean;
  showFooterBar?: boolean;
  headlineColor?: string;
}

export interface BuildPosterHtmlInput {
  layout: LayoutConfig;
  form: PosterForm;
  /** Resolved image sources (data: or absolute file: URLs), one per photo slot. */
  photos: string[];
  overrides?: RenderOverrides;
}

/** Escape a string for safe interpolation into HTML text/attribute context. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '\u0026amp;')
    .replace(/</g, '\u0026lt;')
    .replace(/>/g, '\u0026gt;')
    .replace(/"/g, '\u0026quot;')
    .replace(/'/g, '\u0026#39;');
}

/** Map a text-slot key to the user-supplied string it should display. */
function resolveText(slot: TextSlot, form: PosterForm): string {
  switch (slot.key) {
    case 'headline':
      return form.headline;
    case 'subheadline':
      // The subject's name is the most prominent secondary line on these posters.
      return form.name;
    case 'designation':
      return form.designation;
    default:
      return '';
  }
}

const FOOTER_LABELS: Record<string, string> = {
  organization: 'Organization',
  unionThanaJela: 'Area',
  partyName: 'Party',
  promoteBy: 'Promoted by',
};

/** Compose the footer credit line from the configured keys. */
function buildFooterText(keys: string[], form: PosterForm): string {
  const record = form as unknown as Record<string, string | undefined>;
  return keys
    .map((key) => {
      const value = record[key];
      if (!value) return '';
      const label = FOOTER_LABELS[key];
      return label ? `${label}: ${value}` : value;
    })
    .filter((part) => part.length > 0)
    .join('  •  ');
}

/** Arch = rounded top with a flat base (typical memorial/portrait framing). */
function radiusFor(slot: PhotoSlot): string {
  switch (slot.shape) {
    case 'circle':
      return '50%';
    case 'arch':
      return '50% 50% 6% 6% / 42% 42% 4% 4%';
    default:
      return '18px';
  }
}

/** Placeholder silhouette shown when a photo slot has no supplied image. */
function placeholderSvg(color: string): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMax slice" width="100%" height="100%">` +
    `<circle cx="50" cy="36" r="19" fill="${color}" opacity="0.55"/>` +
    `<path d="M12 100c0-21 17-34 38-34s38 13 38 34z" fill="${color}" opacity="0.55"/>` +
    '</svg>'
  );
}

function renderPhotoSlot(slot: PhotoSlot, photo: string | undefined): string {
  const style = [
    `left:${slot.x}px`,
    `top:${slot.y}px`,
    `width:${slot.w}px`,
    `height:${slot.h}px`,
    `border-radius:${radiusFor(slot)}`,
    slot.borderWidth > 0 ? `border:${slot.borderWidth}px solid ${slot.borderColor}` : 'border:none',
  ].join(';');

  const inner = photo
    ? `<img src="${escapeHtml(photo)}" alt="" />`
    : placeholderSvg(slot.borderColor || '#ffffff');

  return `<div class="photo-slot" style="${style}">${inner}</div>`;
}

function renderTextSlot(slot: TextSlot, form: PosterForm, overrides: RenderOverrides): string {
  const text = resolveText(slot, form).trim();
  if (!text) return '';

  const left =
    slot.align === 'center'
      ? slot.x - slot.maxWidth / 2
      : slot.align === 'right'
        ? slot.x - slot.maxWidth
        : slot.x;

  const isHeadline = slot.key === 'headline';
  const color = isHeadline && overrides.headlineColor ? overrides.headlineColor : slot.color;
  const fontFamily = overrides.fontFamily ?? slot.fontFamily;

  const style = [
    `left:${left}px`,
    `top:${slot.y}px`,
    `width:${slot.maxWidth}px`,
    `font-family:'${fontFamily}', 'Noto Sans Bengali', 'Noto Serif Bengali', sans-serif`,
    `font-size:${slot.fontSize}px`,
    `color:${color}`,
    `text-align:${slot.align}`,
    `line-height:${slot.lineHeight}`,
    isHeadline ? 'font-weight:800' : 'font-weight:600',
  ].join(';');

  return `<div class="text-slot" style="${style}">${escapeHtml(text)}</div>`;
}

/** Decorative motif placements (top-left, top-right, bottom corners, sides). */
const MOTIF_PLACEMENTS: Array<{ top: string; left: string; size: number; rotate?: number }> = [
  { top: '-40px', left: '-40px', size: 300 },
  { top: '-30px', left: 'calc(100% - 240px)', size: 270, rotate: 90 },
  { top: 'calc(100% - 260px)', left: '-40px', size: 280, rotate: -90 },
  { top: 'calc(100% - 240px)', left: 'calc(100% - 230px)', size: 260, rotate: 180 },
  { top: '300px', left: '-70px', size: 210 },
  { top: '320px', left: 'calc(100% - 160px)', size: 220 },
  { top: '620px', left: 'calc(100% - 130px)', size: 170 },
  { top: '640px', left: '-60px', size: 180 },
];

function renderMotifs(layout: LayoutConfig): string {
  const ids = layout.background.motifIds.slice(0, MOTIF_PLACEMENTS.length);
  if (ids.length === 0) return '';

  return ids
    .map((id, index) => {
      const placement = MOTIF_PLACEMENTS[index];
      const color = layout.background.colors[(index % layout.background.colors.length)] ?? '#FFC107';
      const accent = layout.background.colors[((index + 1) % layout.background.colors.length)] ?? '#ffffff';
      const svg = motifSvg(id, { color, accent, opacity: 0.9 });
      if (!svg) return '';
      const rotate = placement.rotate ? `;transform:rotate(${placement.rotate}deg)` : '';
      return `<div class="motif" style="top:${placement.top};left:${placement.left};width:${placement.size}px;height:${placement.size}px${rotate}">${svg}</div>`;
    })
    .join('');
}

function renderBackground(layout: LayoutConfig): string {
  const colors = layout.background.colors.length > 0 ? layout.background.colors : ['#0D1117'];
  if (layout.background.type === 'gradient') {
    const stops = colors.map((color, index) => {
      const pct = Math.round((index / Math.max(1, colors.length - 1)) * 100);
      return `${color} ${pct}%`;
    });
    return `linear-gradient(155deg, ${stops.join(', ')})`;
  }
  return colors[0] ?? '#0D1117';
}

/**
 * Build the complete poster HTML document.
 *
 * The document is intentionally dependency-free: fonts are requested from
 * Google Fonts with a local Noto Bengali fallback, so it renders correctly both
 * online and offline.
 */
export function buildPosterHtml(input: BuildPosterHtmlInput): string {
  const { layout, form, photos } = input;
  const overrides = input.overrides ?? {};
  const { w, h } = layout.canvas;

  // A blank canvas silently clips every layer (body/#poster become 0-height),
  // which is indistinguishable from a valid render downstream. Fail loudly.
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
    throw new Error(
      `buildPosterHtml: invalid canvas dimensions (w=${String(w)}, h=${String(h)}). ` +
        'The layout was likely spread from a Mongoose subdocument rather than a plain object.',
    );
  }

  const photosLayer = layout.photoSlots
    .map((slot, index) => renderPhotoSlot(slot, photos[index]))
    .join('\n');

  const textLayer = layout.textSlots
    .map((slot) => renderTextSlot(slot, form, overrides))
    .join('\n');

  const footerText = buildFooterText(layout.footerBar.keys, form);
  const footer =
    overrides.showFooterBar === false || !footerText
      ? ''
      : `<div class="footer-bar" style="top:${layout.footerBar.y}px;height:${layout.footerBar.h}px;background:${layout.footerBar.bg};color:${layout.footerBar.textColor}">${escapeHtml(footerText)}</div>`;

  const motifs = overrides.showMotifs === false ? '' : renderMotifs(layout);

  return `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=${w}, initial-scale=1" />
<title>Poster</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700&family=Noto+Serif+Bengali:wght@400;600;700;800&display=swap" rel="stylesheet" />
<style>
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    width: ${w}px;
    height: ${h}px;
    overflow: hidden;
    background: ${renderBackground(layout)};
    font-family: 'Hind Siliguri', 'Noto Sans Bengali', 'Noto Serif Bengali', sans-serif;
    -webkit-font-smoothing: antialiased;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  #poster { position: relative; width: ${w}px; height: ${h}px; overflow: hidden; }
  .motif { position: absolute; pointer-events: none; }
  .photo-slot {
    position: absolute;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }
  .photo-slot img { width: 100%; height: 100%; object-fit: cover; object-position: center top; display: block; }
  .photo-slot svg { width: 100%; height: 100%; }
  .text-slot {
    position: absolute;
    text-shadow: 0 4px 18px rgba(0, 0, 0, 0.55), 0 1px 3px rgba(0, 0, 0, 0.7);
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  .footer-bar {
    position: absolute;
    left: 0;
    width: ${w}px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 48px;
    font-size: 34px;
    font-weight: 600;
    letter-spacing: 0.2px;
    text-align: center;
  }
</style>
</head>
<body>
  <div id="poster">
    ${motifs}
    ${photosLayer}
    ${textLayer}
    ${footer}
  </div>
</body>
</html>`;
}
