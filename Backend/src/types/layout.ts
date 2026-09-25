/**
 * Layout configuration contract — FROZEN CONTRACT for downstream slices.
 *
 * A `LayoutConfig` is a fully data-driven description of a poster template.
 * All coordinates are ABSOLUTE PIXELS on a fixed 1200x1600 canvas.
 */

/** Canonical canvas width in pixels. */
export const CANVAS_WIDTH = 1200;
/** Canonical canvas height in pixels. */
export const CANVAS_HEIGHT = 1600;

/** Canvas dimensions. */
export interface CanvasConfig {
  w: number;
  h: number;
}

/** Supported photo slot clip shapes. */
export const SLOT_SHAPES = ['circle', 'rect', 'arch'] as const;
export type SlotShape = (typeof SLOT_SHAPES)[number];

/**
 * A single placeholder where the subject photo is clipped into the poster.
 * Coordinates are absolute pixels on the 1200x1600 canvas.
 */
export interface PhotoSlot {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  shape: SlotShape;
  borderColor: string;
  borderWidth: number;
}

/** Which poster field a text slot renders. */
export const TEXT_SLOT_KEYS = ['headline', 'subheadline', 'designation'] as const;
export type TextSlotKey = (typeof TEXT_SLOT_KEYS)[number];

/** Horizontal text alignment. */
export const TEXT_ALIGNS = ['left', 'center', 'right'] as const;
export type TextAlign = (typeof TEXT_ALIGNS)[number];

/**
 * A single text box. Coordinates are absolute pixels on the 1200x1600 canvas;
 * the renderer wraps text within `maxWidth`.
 */
export interface TextSlot {
  id: string;
  key: TextSlotKey;
  x: number;
  y: number;
  maxWidth: number;
  fontFamily: string;
  fontSize: number;
  color: string;
  align: TextAlign;
  lineHeight: number;
}

/** Background rendering strategy. */
export const BACKGROUND_TYPES = ['gradient', 'image'] as const;
export type BackgroundType = (typeof BACKGROUND_TYPES)[number];

/** Poster background definition. */
export interface BackgroundConfig {
  type: BackgroundType;
  /** CSS color stops for `gradient` backgrounds. */
  colors: string[];
  /** Identifiers of decorative motif overlays to composite. */
  motifIds: string[];
}

/** Bottom bar containing party/organization/administrative metadata. */
export interface FooterBarConfig {
  y: number;
  h: number;
  bg: string;
  textColor: string;
  /** Named keys (e.g. organization, unionThanaJela, partyName) rendered in the bar. */
  keys: string[];
}

/** The complete, data-driven layout description of a poster template. */
export interface LayoutConfig {
  canvas: CanvasConfig;
  background: BackgroundConfig;
  photoSlots: PhotoSlot[];
  textSlots: TextSlot[];
  footerBar: FooterBarConfig;
}

/** A sensible default layout used as a fallback / seed baseline. */
export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  canvas: { w: CANVAS_WIDTH, h: CANVAS_HEIGHT },
  background: {
    type: 'gradient',
    colors: ['#0b1f3a', '#1d4ed8', '#f8fafc'],
    motifIds: [],
  },
  photoSlots: [
    {
      id: 'portrait',
      x: 350,
      y: 300,
      w: 500,
      h: 500,
      shape: 'circle',
      borderColor: '#f8fafc',
      borderWidth: 12,
    },
  ],
  textSlots: [
    {
      id: 'headline',
      key: 'headline',
      x: 600,
      y: 900,
      maxWidth: 1000,
      fontFamily: 'Noto Sans Bengali',
      fontSize: 96,
      color: '#ffffff',
      align: 'center',
      lineHeight: 1.15,
    },
    {
      id: 'subheadline',
      key: 'subheadline',
      x: 600,
      y: 1080,
      maxWidth: 1000,
      fontFamily: 'Noto Sans Bengali',
      fontSize: 52,
      color: '#fde68a',
      align: 'center',
      lineHeight: 1.2,
    },
    {
      id: 'designation',
      key: 'designation',
      x: 600,
      y: 1220,
      maxWidth: 1000,
      fontFamily: 'Noto Sans Bengali',
      fontSize: 40,
      color: '#e2e8f0',
      align: 'center',
      lineHeight: 1.2,
    },
  ],
  footerBar: {
    y: 1450,
    h: 150,
    bg: '#0b1f3a',
    textColor: '#ffffff',
    keys: ['organization', 'unionThanaJela', 'partyName'],
  },
};
