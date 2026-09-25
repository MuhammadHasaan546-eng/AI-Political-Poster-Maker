import { Schema, model, type HydratedDocument, type Model } from 'mongoose';
import {
  BACKGROUND_TYPES,
  SLOT_SHAPES,
  TEXT_ALIGNS,
  TEXT_SLOT_KEYS,
  type BackgroundConfig,
  type CanvasConfig,
  type FooterBarConfig,
  type LayoutConfig,
  type PhotoSlot,
  type TextSlot,
} from '../types/layout';
import { OCCASION_TYPES, type OccasionType } from '../types/domain';

/** A reusable, data-driven poster template. */
export interface ITemplate {
  /** Template name (Bangla). */
  name: string;
  occasionType: OccasionType;
  thumbnailUrl: string;
  isActive: boolean;
  /** Fully data-driven layout description (absolute px on a 1200x1600 canvas). */
  layoutConfig: LayoutConfig;
  createdAt: Date;
  updatedAt: Date;
}

/* ------------------------------------------------------------------ *
 * Nested layout sub-schemas (embedded, no `_id`).
 * ------------------------------------------------------------------ */

const canvasSchema = new Schema<CanvasConfig>(
  {
    w: { type: Number, required: true },
    h: { type: Number, required: true },
  },
  { _id: false },
);

const backgroundSchema = new Schema<BackgroundConfig>(
  {
    type: { type: String, enum: BACKGROUND_TYPES, required: true },
    colors: { type: [String], default: [] },
    motifIds: { type: [String], default: [] },
  },
  { _id: false },
);

const photoSlotSchema = new Schema<PhotoSlot>(
  {
    id: { type: String, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    w: { type: Number, required: true },
    h: { type: Number, required: true },
    shape: { type: String, enum: SLOT_SHAPES, required: true },
    borderColor: { type: String, default: '#ffffff' },
    borderWidth: { type: Number, default: 0 },
  },
  { _id: false },
);

const textSlotSchema = new Schema<TextSlot>(
  {
    id: { type: String, required: true },
    key: { type: String, enum: TEXT_SLOT_KEYS, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    maxWidth: { type: Number, required: true },
    fontFamily: { type: String, required: true },
    fontSize: { type: Number, required: true },
    color: { type: String, required: true },
    align: { type: String, enum: TEXT_ALIGNS, default: 'center' },
    lineHeight: { type: Number, default: 1.2 },
  },
  { _id: false },
);

const footerBarSchema = new Schema<FooterBarConfig>(
  {
    y: { type: Number, required: true },
    h: { type: Number, required: true },
    bg: { type: String, required: true },
    textColor: { type: String, required: true },
    keys: { type: [String], default: [] },
  },
  { _id: false },
);

const layoutConfigSchema = new Schema<LayoutConfig>(
  {
    canvas: { type: canvasSchema, required: true },
    background: { type: backgroundSchema, required: true },
    photoSlots: { type: [photoSlotSchema], default: [] },
    textSlots: { type: [textSlotSchema], default: [] },
    footerBar: { type: footerBarSchema, required: true },
  },
  { _id: false },
);

/* ------------------------------------------------------------------ *
 * Template schema.
 * ------------------------------------------------------------------ */

const templateSchema = new Schema<ITemplate>(
  {
    name: { type: String, required: true, trim: true },
    occasionType: { type: String, enum: OCCASION_TYPES, required: true, index: true },
    thumbnailUrl: { type: String, default: '' },
    isActive: { type: Boolean, default: true, index: true },
    layoutConfig: { type: layoutConfigSchema, required: true },
  },
  { timestamps: true, versionKey: false },
);

export type TemplateDocument = HydratedDocument<ITemplate>;
export const Template: Model<ITemplate> = model<ITemplate>('Template', templateSchema);

export default Template;
