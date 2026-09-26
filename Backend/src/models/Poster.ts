import { Schema, model, Types, type HydratedDocument, type Model } from 'mongoose';
import { OCCASION_TYPES, POSTER_STATUSES, type OccasionType, type PosterStatus } from '../types/domain';
import type { CreativeBrief } from '../types/brief';
import type { LayoutConfig } from '../types/layout';

/** A single poster generation job and all of its inputs/outputs. */
export interface IPoster {
  userId: Types.ObjectId;
  templateId: Types.ObjectId;
  status: PosterStatus;

  // --- User input fields ---
  occasionType: OccasionType;
  headline: string;
  name: string;
  designation: string;
  organization?: string;
  unionThanaJela?: string;
  partyName?: string;
  /** Footer credit line, e.g. "Promoted by — Youth Organization". */
  promoteBy?: string;
  photoUrls: string[];

  // --- Generation artifacts ---
  creativeBrief?: CreativeBrief;
  layoutSnapshot?: LayoutConfig;
  generatedImageUrl?: string;
  thumbnailUrl?: string;
  pdfUrl?: string;
  errorMessage?: string;
  regenerationCount: number;

  createdAt: Date;
  updatedAt: Date;
}

const posterSchema = new Schema<IPoster>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    templateId: { type: Schema.Types.ObjectId, ref: 'Template', required: true, index: true },
    status: { type: String, enum: POSTER_STATUSES, default: 'pending', required: true, index: true },

    occasionType: { type: String, enum: OCCASION_TYPES, default: 'general', required: true },
    headline: { type: String, default: '' },
    name: { type: String, default: '' },
    designation: { type: String, default: '' },
    organization: { type: String, default: '' },
    unionThanaJela: { type: String, default: '' },
    partyName: { type: String, default: '' },
    promoteBy: { type: String, default: '' },
    photoUrls: { type: [String], default: [] },

    creativeBrief: { type: Schema.Types.Mixed },
    layoutSnapshot: { type: Schema.Types.Mixed },
    generatedImageUrl: { type: String, default: '' },
    thumbnailUrl: { type: String, default: '' },
    pdfUrl: { type: String, default: '' },
    errorMessage: { type: String, default: '' },
    regenerationCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, versionKey: false },
);

posterSchema.index({ userId: 1, createdAt: -1 });

export type PosterDocument = HydratedDocument<IPoster>;
export const Poster: Model<IPoster> = model<IPoster>('Poster', posterSchema);

export default Poster;
