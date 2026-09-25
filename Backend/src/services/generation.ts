import { promises as fs } from 'node:fs';
import path from 'node:path';
import { env } from '../config/env';
import { GenerationLog, Poster, Template } from '../models';
import type { CreativeBrief } from '../types/brief';
import type { LayoutConfig } from '../types/layout';
import { generateBrief } from './gemini';
import { MOTIF_IDS } from './motifs';
import { renderPosterPdf, renderPosterPng } from './render';
import { createStorage, STORAGE_ROOT } from './storage';
import type { PosterForm } from './layout';

/**
 * Generation orchestrator.
 *
 * Drives one poster job end to end:
 *   1. AI creative brief (Gemini, with heuristic fallback)
 *   2. Merge brief theming into the template `LayoutConfig`
 *   3. Resolve photo references into Chrome-consumable data URIs
 *   4. Render print-ready PNG (2400x3200) + PDF
 *   5. Persist assets via the storage driver and update the poster record
 *
 * Every attempt is recorded in `GenerationLog` (success or failure).
 */

/** Resolve a photo reference into a `data:` URI Chrome can render offline. */
async function resolvePhotoToDataUri(url: string): Promise<string | undefined> {
  if (!url) return undefined;

  // Already inline.
  if (url.startsWith('data:')) return url;

  try {
    // Locally stored asset: read straight from disk (fast + offline-safe).
    const marker = '/storage/';
    const markerIndex = url.indexOf(marker);
    if (markerIndex !== -1) {
      const relative = decodeURIComponent(url.slice(markerIndex + marker.length));
      const absolute = path.join(STORAGE_ROOT, relative);
      if (absolute.startsWith(STORAGE_ROOT)) {
        const buffer = await fs.readFile(absolute);
        const ext = path.extname(absolute).slice(1).toLowerCase();
        const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : 'image/png';
        return `data:${mime};base64,${buffer.toString('base64')}`;
      }
    }

    // Remote asset (Cloudinary or external): download and inline.
    const response = await fetch(url);
    if (!response.ok) return undefined;
    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') ?? 'image/png';
    return `data:${contentType};base64,${Buffer.from(arrayBuffer).toString('base64')}`;
  } catch {
    // Missing / unreachable photo — the renderer falls back to a placeholder.
    return undefined;
  }
}

/**
 * Deep-copy a layout into a plain-object graph.
 *
 * `LayoutConfig` frequently arrives as a live Mongoose subdocument (e.g.
 * `template.layoutConfig`). Mongoose defines schema fields as prototype
 * getters, so spreading such a value yields only internal keys (`$__`,
 * `$__parent`, ...) and silently drops `canvas`, `photoSlots`, etc. Going
 * through `toObject()` + a JSON round-trip guarantees a plain, fully-owned
 * clone that is safe to spread and mutate.
 */
function toPlainLayout(layout: LayoutConfig): LayoutConfig {
  const candidate = layout as unknown as { toObject?: () => unknown };
  const source = typeof candidate.toObject === 'function' ? candidate.toObject() : layout;
  return JSON.parse(JSON.stringify(source)) as LayoutConfig;
}

/**
 * Apply brief-derived theming to a layout, returning a NEW layout (the
 * template's stored layout is never mutated).
 */
export function applyBriefToLayout(layout: LayoutConfig, brief: CreativeBrief): LayoutConfig {
  const source = toPlainLayout(layout);
  const palette = (brief.palette ?? []).filter((color) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color));
  const motifs = (brief.motifs ?? []).filter((id) => MOTIF_IDS.includes(id));

  const next: LayoutConfig = {
    canvas: { ...source.canvas },
    background: {
      ...source.background,
      colors: palette.length >= 2 ? palette.slice(0, 3) : source.background.colors,
      motifIds: motifs.length > 0 ? motifs.slice(0, 8) : source.background.motifIds,
    },
    photoSlots: source.photoSlots.map((slot) => ({ ...slot })),
    textSlots: source.textSlots.map((slot) => {
      const clone = { ...slot };
      // Tint the headline with the brief's accent color when available.
      if (clone.key === 'headline' && palette.length >= 2) {
        clone.color = '#FFFFFF';
      }
      return clone;
    }),
    footerBar: { ...source.footerBar, keys: [...source.footerBar.keys] },
  };

  return next;
}

export interface RunGenerationResult {
  success: boolean;
  errorMessage?: string;
}

/**
 * Execute a poster generation job. Never throws — failures are persisted on the
 * poster record and logged, so callers can simply fire-and-forget.
 */
export async function runGeneration(posterId: string): Promise<RunGenerationResult> {
  const poster = await Poster.findById(posterId);
  if (!poster) {
    console.warn(`[generation] Poster ${posterId} not found; aborting.`);
    return { success: false, errorMessage: 'Poster not found.' };
  }

  const template = await Template.findById(poster.templateId);
  if (!template) {
    poster.status = 'failed';
    poster.errorMessage = 'Template not found.';
    await poster.save();
    return { success: false, errorMessage: poster.errorMessage };
  }

  poster.status = 'generating';
  poster.errorMessage = '';
  await poster.save();

  const form: PosterForm = {
    occasionType: poster.occasionType,
    headline: poster.headline,
    name: poster.name,
    designation: poster.designation,
    organization: poster.organization,
    unionThanaJela: poster.unionThanaJela,
    partyName: poster.partyName,
    promoteBy: poster.promoteBy,
  };

  const startedAt = Date.now();
  let prompt = '';

  try {
    // 1. AI art direction (falls back to a deterministic heuristic).
    const briefResult = await generateBrief({
      occasionType: poster.occasionType,
      headline: poster.headline,
      name: poster.name,
      designation: poster.designation,
      organization: poster.organization,
      partyName: poster.partyName,
      unionThanaJela: poster.unionThanaJela,
    });
    prompt = briefResult.prompt;
    const brief = briefResult.brief;

    // 2. Merge brief theming into the template layout.
    const layout = applyBriefToLayout(template.layoutConfig, brief);

    // 3. Inline photos so Chrome can render without network access.
    const photos = await Promise.all(
      (poster.photoUrls ?? []).slice(0, layout.photoSlots.length).map(resolvePhotoToDataUri),
    );

    // 4. Render print-ready artifacts.
    const renderInput = { layout, form, photos: photos as string[] };
    const [png, pdf] = await Promise.all([
      renderPosterPng(renderInput),
      renderPosterPdf(renderInput),
    ]);

    // 5. Persist assets.
    const storage = createStorage();
    const [image, pdfAsset] = await Promise.all([
      storage.upload(png, {
        folder: `${env.CLOUDINARY_FOLDER}/posters`,
        filename: `poster-${poster.id}`,
        mimeType: 'image/png',
        tags: ['poster', poster.occasionType],
      }),
      storage.upload(pdf, {
        folder: `${env.CLOUDINARY_FOLDER}/posters`,
        filename: `poster-${poster.id}`,
        mimeType: 'application/pdf',
        tags: ['poster', 'pdf'],
      }),
    ]);

    poster.creativeBrief = brief;
    poster.layoutSnapshot = layout;
    poster.generatedImageUrl = image.url;
    poster.thumbnailUrl = image.url;
    poster.pdfUrl = pdfAsset.url;
    poster.status = 'completed';
    poster.errorMessage = '';
    await poster.save();

    const latencyMs = Date.now() - startedAt;
    await GenerationLog.create({
      posterId: poster._id,
      prompt,
      latencyMs,
      success: true,
      tokenEstimate: Math.round(prompt.length / 4),
    });

    console.log(
      `[generation] Poster ${poster.id} completed in ${latencyMs}ms ` +
        `(png ${png.byteLength} bytes, pdf ${pdf.byteLength} bytes).`,
    );
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const latencyMs = Date.now() - startedAt;

    poster.status = 'failed';
    poster.errorMessage = message;
    await poster.save().catch(() => undefined);

    await GenerationLog.create({
      posterId: poster._id,
      prompt,
      latencyMs,
      success: false,
      errorMessage: message,
    }).catch(() => undefined);

    console.error(`[generation] Poster ${poster.id} failed after ${latencyMs}ms: ${message}`);
    return { success: false, errorMessage: message };
  }
}
