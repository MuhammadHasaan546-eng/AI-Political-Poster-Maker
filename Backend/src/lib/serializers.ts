import type { PosterDocument, TemplateDocument } from '../models';

/**
 * Document -> API serializers.
 *
 * The frontend consumes a slightly different shape than the database stores
 * (flat poster columns are nested under `formData`, `promoteBy` lives in the
 * form, and `Template.name` is surfaced as `title`). Centralising the mapping
 * here keeps the two contracts from drifting.
 */

/** Serialized poster exactly as the frontend `Poster` type expects. */
export interface SerializedPoster {
  id: string;
  templateId: string;
  formData: {
    occasionType: string;
    headline: string;
    name: string;
    designation: string;
    organization: string;
    unionThanaJela: string;
    partyName: string;
    promoteBy: string;
  };
  uploadedPhotoUrls: string[];
  generatedImageUrl: string | null;
  thumbnailUrl: string | null;
  pdfUrl: string | null;
  status: string;
  regenerationCount: number;
  errorMessage: string | null;
  creativeBrief: unknown;
  createdAt: string;
}

export function serializePoster(poster: PosterDocument): SerializedPoster {
  return {
    id: poster.id as string,
    templateId: String(poster.templateId),
    formData: {
      occasionType: poster.occasionType,
      headline: poster.headline,
      name: poster.name,
      designation: poster.designation,
      organization: poster.organization ?? '',
      unionThanaJela: poster.unionThanaJela ?? '',
      partyName: poster.partyName ?? '',
      promoteBy: poster.promoteBy ?? '',
    },
    uploadedPhotoUrls: poster.photoUrls ?? [],
    generatedImageUrl: poster.generatedImageUrl || null,
    thumbnailUrl: poster.thumbnailUrl || null,
    pdfUrl: poster.pdfUrl || null,
    status: poster.status,
    regenerationCount: poster.regenerationCount,
    errorMessage: poster.errorMessage || null,
    creativeBrief: poster.creativeBrief ?? null,
    createdAt: (poster.createdAt ?? new Date()).toISOString(),
  };
}

/** Serialized template exactly as the frontend `Template` type expects. */
export interface SerializedTemplate {
  id: string;
  title: string;
  occasionType: string;
  thumbnailUrl: string;
  layoutConfig: unknown;
  isActive: boolean;
}

export function serializeTemplate(template: TemplateDocument): SerializedTemplate {
  return {
    id: template.id as string,
    title: template.name,
    occasionType: template.occasionType,
    thumbnailUrl: template.thumbnailUrl,
    layoutConfig: template.layoutConfig,
    isActive: template.isActive,
  };
}
