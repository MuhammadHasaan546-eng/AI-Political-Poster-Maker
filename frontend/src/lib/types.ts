/**
 * Shared frontend domain types.
 * Mirrors the frozen backend contract (Backend/src/types) so the two stay aligned.
 */

/* ----------------------------- Occasions ----------------------------- */

/**
 * Canonical occasion ids — MUST mirror the backend `OCCASION_TYPES`
 * (`Backend/src/types/domain.ts`). Templates and posters returned by the API
 * are keyed by these ids, so the two unions have to stay byte-for-byte equal.
 */
export const OCCASION_TYPES = [
  "general",
  "eid",
  "ramadan",
  "independence-day",
  "victory-day",
  "political-rally",
  "election-campaign",
  "condolence",
  "congratulation",
  "birthday",
] as const;

export type OccasionType = (typeof OCCASION_TYPES)[number];

/** UI filter value (adds the "all" pseudo-category). */
export type OccasionFilter = OccasionType | "all";

export const OCCASION_LABELS: Record<OccasionType, string> = {
  general: "General",
  eid: "Eid",
  ramadan: "Ramadan",
  "independence-day": "Independence Day",
  "victory-day": "Victory Day",
  "political-rally": "Rally / Procession",
  "election-campaign": "Election Campaign",
  condolence: "Tribute / Remembrance",
  congratulation: "Congratulations",
  birthday: "Birthday",
};

export const OCCASION_LABELS_EN: Record<OccasionType, string> = {
  general: "General",
  eid: "Eid",
  ramadan: "Ramadan",
  "independence-day": "Independence Day",
  "victory-day": "Victory Day",
  "political-rally": "Political Rally",
  "election-campaign": "Election Campaign",
  condolence: "Condolence",
  congratulation: "Congratulation",
  birthday: "Birthday",
};

/* ---------------------------- Layout contract ---------------------------- */

export type SlotShape = "circle" | "rect" | "arch";
export type TextSlotKey = "headline" | "subheadline" | "designation";
export type TextAlign = "left" | "center" | "right";
export type BackgroundType = "gradient" | "image";

export interface CanvasConfig {
  w: number;
  h: number;
}

export interface BackgroundConfig {
  type: BackgroundType;
  colors: string[];
  motifIds: string[];
}

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

export interface FooterBarConfig {
  y: number;
  h: number;
  bg: string;
  textColor: string;
  keys: string[];
}

export interface LayoutConfig {
  canvas: CanvasConfig;
  background: BackgroundConfig;
  photoSlots: PhotoSlot[];
  textSlots: TextSlot[];
  footerBar: FooterBarConfig;
}

/* ------------------------------- Entities ------------------------------- */

export type UserRole = "user" | "admin";

export interface User {
  id: string;
  name: string;
  emailOrPhone: string;
  role: UserRole;
}

export interface Template {
  id: string;
  title: string;
  occasionType: OccasionType;
  thumbnailUrl: string;
  layoutConfig: LayoutConfig;
  badge?: string;
  isActive: boolean;
}

export type PosterStatus = "draft" | "generating" | "completed" | "failed";

export interface PosterFormData {
  occasionType: OccasionType;
  headline: string;
  name: string;
  designation: string;
  organization: string;
  unionThanaJela: string;
  partyName: string;
  promoteBy: string;
}

export interface Poster {
  id: string;
  templateId: string;
  formData: PosterFormData;
  uploadedPhotoUrls: string[];
  /** Public URL of the AI-rendered PNG (null until generation completes). */
  generatedImageUrl: string | null;
  thumbnailUrl: string | null;
  /** Public URL of the print-ready PDF. */
  pdfUrl: string | null;
  status: PosterStatus;
  regenerationCount: number;
  errorMessage: string | null;
  /** Art-direction metadata produced by Gemini (or the heuristic fallback). */
  creativeBrief: CreativeBrief | null;
  createdAt: string;
}

/** Payload accepted by `POST /api/posters`. */
export interface GeneratePosterRequest {
  templateId: string;
  formData: PosterFormData;
  uploadedPhotoUrls: string[];
}

/** Live tuning state owned by the builder (applied on top of a layout). */
export interface LayerSettings {
  photoScale: number;
  photoOffsetY: number;
  fontFamily: string;
  showMotifs: boolean;
  showFooterBar: boolean;
  headlineColor: string;
}

export const DEFAULT_LAYER_SETTINGS: LayerSettings = {
  photoScale: 1,
  photoOffsetY: 0,
  fontFamily: "Hind Siliguri",
  showMotifs: true,
  showFooterBar: true,
  headlineColor: "#FFFFFF",
};

/* --------------------------- AI layout analysis --------------------------- */

export interface LayoutSuggestion {
  palette: string[];
  motifs: string[];
  headlineFontFamily: string;
  headlineFontSize: number;
  badgePlacement: TextAlign;
  backgroundPrompt: string;
  rationale: string;
}

export interface CreativeBrief {
  theme?: string;
  mood?: string;
  palette?: string[];
  motifs?: string[];
  backgroundPrompt?: string;
  compositionNotes?: string;
  typographyNotes?: string;
  generatedBy?: string;
  model?: string;
}

/* ------------------------------- API envelope ------------------------------- */

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  error: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

/** Available Bangla font families for the builder font selector. */
export const BANGLA_FONTS = [
  "Hind Siliguri",
  "Noto Serif Bengali",
  "Kalpurush",
  "SolaimanLipi",
] as const;

export type BanglaFont = (typeof BANGLA_FONTS)[number];
