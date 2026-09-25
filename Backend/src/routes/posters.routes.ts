import { Router } from 'express';
import { env } from '../config/env';
import { requireAuth } from '../middleware/auth';
import { Poster, Template } from '../models';
import { asyncHandler, asString, fail, isObjectId, ok } from '../lib/http';
import { serializePoster } from '../lib/serializers';
import { runGeneration } from '../services/generation';
import { generateBrief } from '../services/gemini';
import { createStorage } from '../services/storage';
import { createPosterSchema, regenerateSchema } from '../validations/schemas';
import { OCCASION_TYPES } from '../types/domain';

/** Poster generation, polling, regeneration and history. */
const router = Router();

/** POST /posters/analyze — AI layout suggestions (palette, motifs, fonts). */
router.post(
  '/analyze',
  asyncHandler(async (req, res) => {
    const occasionType = asString((req.body as { occasionType?: unknown }).occasionType) ?? 'general';
    const headline = asString((req.body as { headline?: unknown }).headline) ?? '';
    const safeOccasion = (OCCASION_TYPES as readonly string[]).includes(occasionType)
      ? (occasionType as (typeof OCCASION_TYPES)[number])
      : 'general';

    const { brief } = await generateBrief({ occasionType: safeOccasion, headline });

    return ok(res, {
      palette: brief.palette ?? ['#006A4E', '#FFC107', '#0D1117'],
      motifs: brief.motifs ?? ['flag', 'star'],
      headlineFontFamily:
        brief.typographyNotes && /serif/i.test(brief.typographyNotes)
          ? 'Noto Serif Bengali'
          : 'Hind Siliguri',
      headlineFontSize: headline.length > 20 ? 76 : 92,
      badgePlacement: 'center',
      backgroundPrompt: brief.backgroundPrompt ?? '',
      rationale: brief.compositionNotes ?? 'AI পরামর্শ প্রয়োগ করা হয়েছে।',
    });
  }),
);

/** GET /posters — the caller's poster history (newest first, optional paging). */
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const limitRaw = Number(asString(req.query.limit));
    const offsetRaw = Number(asString(req.query.offset));
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 100;
    const offset = Number.isFinite(offsetRaw) && offsetRaw > 0 ? Math.floor(offsetRaw) : 0;

    const docs = await Poster.find({ userId: req.user!.id })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);
    return ok(res, docs.map(serializePoster));
  }),
);

/** POST /posters — create a job and kick off rendering in the background. */
router.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = createPosterSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, 422, parsed.error.issues[0]?.message ?? 'Invalid input.', 'VALIDATION_ERROR');
    }

    const { templateId, formData, uploadedPhotoUrls } = parsed.data;
    if (!isObjectId(templateId)) {
      return fail(res, 400, 'টেমপ্লেট নির্বাচন সঠিক নয়।', 'INVALID_TEMPLATE');
    }

    const template = await Template.findById(templateId);
    if (!template) return fail(res, 404, 'টেমপ্লেট পাওয়া যায়নি।', 'NOT_FOUND');

    const maxPhotos = template.layoutConfig.photoSlots.length;
    const poster = await Poster.create({
      userId: req.user!.id,
      templateId: template._id,
      status: 'pending',
      occasionType: formData.occasionType,
      headline: formData.headline,
      name: formData.name,
      designation: formData.designation,
      organization: formData.organization,
      unionThanaJela: formData.unionThanaJela,
      partyName: formData.partyName,
      promoteBy: formData.promoteBy,
      photoUrls: uploadedPhotoUrls.slice(0, maxPhotos),
    });

    // Heavy render runs detached; the client polls GET /posters/:id.
    void runGeneration(poster.id as string);

    return ok(res, serializePoster(poster), 201);
  }),
);

/** GET /posters/:id — poll job status (owner or admin). */
router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!isObjectId(id)) return fail(res, 400, 'Invalid poster id.', 'INVALID_ID');

    const poster = await Poster.findById(id);
    if (!poster) return fail(res, 404, 'পোস্টার পাওয়া যায়নি।', 'NOT_FOUND');

    const isOwner = String(poster.userId) === req.user!.id;
    if (!isOwner && req.user!.role !== 'admin') {
      return fail(res, 403, 'এই পোস্টারে আপনার অ্যাক্সেস নেই।', 'FORBIDDEN');
    }

    return ok(res, serializePoster(poster));
  }),
);

/** POST /posters/:id/regenerate — re-roll a poster with optional overrides. */
router.post(
  '/:id/regenerate',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!isObjectId(id)) return fail(res, 400, 'Invalid poster id.', 'INVALID_ID');

    // Optional font/colour/visibility overrides supplied by the builder.
    const parsed = regenerateSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return fail(res, 422, parsed.error.issues[0]?.message ?? 'Invalid input.', 'VALIDATION_ERROR');
    }
    const overrides = parsed.data.overrides ?? {};

    const poster = await Poster.findById(id);
    if (!poster) return fail(res, 404, 'পোস্টার পাওয়া যায়নি।', 'NOT_FOUND');

    const isOwner = String(poster.userId) === req.user!.id;
    if (!isOwner && req.user!.role !== 'admin') {
      return fail(res, 403, 'এই পোস্টারে আপনার অ্যাক্সেস নেই।', 'FORBIDDEN');
    }

    if (poster.regenerationCount >= env.MAX_REGENERATIONS) {
      return fail(
        res,
        429,
        `পুনরায় তৈরির সীমা (${env.MAX_REGENERATIONS}) শেষ হয়েছে।`,
        'REGEN_LIMIT',
      );
    }

    poster.regenerationCount += 1;
    poster.status = 'pending';
    poster.errorMessage = '';
    await poster.save();

    void runGeneration(poster.id as string, overrides);
    return ok(res, serializePoster(poster), 202);
  }),
);

/** DELETE /posters/:id — remove a poster and its stored assets. */
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!isObjectId(id)) return fail(res, 400, 'Invalid poster id.', 'INVALID_ID');

    const poster = await Poster.findById(id);
    if (!poster) return fail(res, 404, 'পোস্টার পাওয়া যায়নি।', 'NOT_FOUND');

    const isOwner = String(poster.userId) === req.user!.id;
    if (!isOwner && req.user!.role !== 'admin') {
      return fail(res, 403, 'এই পোস্টারে আপনার অ্যাক্সেস নেই।', 'FORBIDDEN');
    }

    // Best-effort asset cleanup; never block the delete on storage errors.
    const storage = createStorage();
    if (storage.name === 'local') {
      const publicIds = [poster.generatedImageUrl, poster.pdfUrl]
        .map((url) => (url ? url.split('/storage/')[1] : undefined))
        .filter((value): value is string => Boolean(value));
      await Promise.all(
        publicIds.map((publicId) => storage.delete?.(publicId).catch(() => undefined)),
      );
    }

    await poster.deleteOne();
    return ok(res, { id });
  }),
);

export default router;
