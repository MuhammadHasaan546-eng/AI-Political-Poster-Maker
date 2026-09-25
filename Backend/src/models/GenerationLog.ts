import { Schema, model, Types, type HydratedDocument, type Model } from 'mongoose';

/** Telemetry for a single LLM/render generation attempt. */
export interface IGenerationLog {
  posterId: Types.ObjectId;
  prompt: string;
  latencyMs: number;
  success: boolean;
  tokenEstimate?: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const generationLogSchema = new Schema<IGenerationLog>(
  {
    posterId: { type: Schema.Types.ObjectId, ref: 'Poster', required: true, index: true },
    prompt: { type: String, default: '' },
    latencyMs: { type: Number, default: 0, min: 0 },
    success: { type: Boolean, default: false, required: true },
    tokenEstimate: { type: Number, default: 0, min: 0 },
    errorMessage: { type: String, default: '' },
  },
  { timestamps: true, versionKey: false },
);

export type GenerationLogDocument = HydratedDocument<IGenerationLog>;
export const GenerationLog: Model<IGenerationLog> = model<IGenerationLog>(
  'GenerationLog',
  generationLogSchema,
);

export default GenerationLog;
