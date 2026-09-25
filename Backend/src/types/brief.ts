/**
 * Creative brief contract — FROZEN CONTRACT for downstream slices.
 *
 * The creative brief is the (loosely structured) output of the LLM layout
 * reasoning step. Every field is optional so partial / evolving model output
 * remains valid. Stored on `Poster.creativeBrief` as a Mixed subdocument.
 */
export interface CreativeBrief {
  /** Short theme statement, e.g. "Victory Day tribute". */
  theme?: string;
  /** Emotional tone, e.g. "solemn", "celebratory", "patriotic". */
  mood?: string;
  /** Hex colors the model recommends (primary -> accent). */
  palette?: string[];
  /** Named decorative motifs to composite (maps to `background.motifIds`). */
  motifs?: string[];
  /** Prompt used to synthesize a decorative background plate. */
  backgroundPrompt?: string;
  /** Freeform art-direction notes for the renderer. */
  compositionNotes?: string;
  /** Typography guidance (font family, weight, casing). */
  typographyNotes?: string;
  /** Model-suggested headline copy (Bangla). */
  headlineSuggestion?: string;
  /** Model-suggested subheadline copy (Bangla). */
  subheadlineSuggestion?: string;
  /** Which engine produced the brief, e.g. `gemini` or `heuristic`. */
  generatedBy?: string;
  /** Model identifier used, e.g. `gemini-2.5-flash`. */
  model?: string;
  /** Escape hatch for forward-compatible extra fields. */
  extra?: Record<string, unknown>;
}
