import { Router } from 'express';
import { requireAdmin } from '../middleware/requireAdmin';
import { GenerationLog, Poster, Template, User } from '../models';
import { asyncHandler, asString, fail, isObjectId, ok } from '../lib/http';
import { serializePoster, serializeTemplate } from '../lib/serializers';
import { createTemplateSchema } from '../validations/schemas';
import { POSTER_STATUSES, type PosterStatus } from '../types/domain';
import { DEFAULT_LAYOUT_CONFIG, type LayoutConfig } from '../types/layout';
import { createStorage } from '../services/storage';
import { TEMPLATE_SEEDS } from '../services/template-seeds';

/** Admin-only template management, poster moderation and telemetry. */
const router = Router();

// Everything below requires an authenticated admin.
router.use(requireAdmin);

/* --------------------------------- Stats --------------------------------- */

router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const [
      templateTotal,
      templateActive,
      posterTotal,
      pending,
      generating,
      completed,
      failed,
      userTotal,
      logs,
    ] = await Promise.all([
      Template.countDocuments({}),
      Template.countDocuments({ isActive: true }),
      Poster.countDocuments({}),
      Poster.countDocuments({ status: 'pending' }),
      Poster.countDocuments({ status: 'generating' }),
      Poster.countDocuments({ status: 'completed' }),
      Poster.countDocuments({ status: 'failed' }),
      User.countDocuments({}),
      GenerationLog.find({}).sort({ createdAt: -1 }).limit(500),
    ]);

    const logTotal = logs.length;
    const logSuccess = logs.filter((log) => log.success).length;
    const latencySum = logs.reduce((sum, log) => sum + (log.latencyMs ?? 0), 0);
    const tokenSum = logs.reduce((sum, log) => sum + (log.tokenEstimate ?? 0), 0);

    return ok(res, {
      templates: { total: templateTotal, active: templateActive },
      posters: { total: posterTotal, pending, generating, completed, failed },
      users: { total: userTotal },
      logs: {
        total: logTotal,
        success: logSuccess,
        failed: logTotal - logSuccess,
        avgLatencyMs: logTotal > 0 ? Math.round(latencySum / logTotal) : 0,
        totalTokens: tokenSum,
      },
    });
  }),
);

/* ------------------------------- Templates ------------------------------- */

router.get(
  '/templates',
  asyncHandler(async (_req, res) => {
    const docs = await Template.find({}).sort({ createdAt: 1 });
    return ok(res, docs.map(serializeTemplate));
  }),
);

/** Re-seed the built-in library. Existing templates are left untouched. */
router.post(
  '/templates/seed',
  asyncHandler(async (_req, res) => {
    const existing = await Template.countDocuments({});
    if (existing > 0) {
      return ok(res, { inserted: 0, skipped: existing });
    }
    const created = await Template.insertMany(TEMPLATE_SEEDS, { ordered: false });
    return ok(res, { inserted: created.length }, 201);
  }),
);

router.post(
  '/templates',
  asyncHandler(async (req, res) => {
    const parsed = createTemplateSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, 422, parsed.error.issues[0]?.message ?? 'Invalid input.', 'VALIDATION_ERROR');
    }

    const doc = await Template.create({
      name: parsed.data.name,
      occasionType: parsed.data.occasionType,
      thumbnailUrl: parsed.data.thumbnailUrl,
      isActive: parsed.data.isActive,
      layoutConfig: parsed.data.layoutConfig as unknown as LayoutConfig,
    });

    return ok(res, serializeTemplate(doc), 201);
  }),
);

router.get(
  '/templates/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!isObjectId(id)) return fail(res, 400, 'Invalid template id.', 'INVALID_ID');
    const doc = await Template.findById(id);
    if (!doc) return fail(res, 404, 'টেমপ্লেট পাওয়া যায়নি।', 'NOT_FOUND');
    return ok(res, serializeTemplate(doc));
  }),
);

router.patch(
  '/templates/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!isObjectId(id)) return fail(res, 400, 'Invalid template id.', 'INVALID_ID');

    const parsed = createTemplateSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return fail(res, 422, parsed.error.issues[0]?.message ?? 'Invalid input.', 'VALIDATION_ERROR');
    }

    const doc = await Template.findById(id);
    if (!doc) return fail(res, 404, 'টেমপ্লেট পাওয়া যায়নি।', 'NOT_FOUND');

    if (parsed.data.name !== undefined) doc.name = parsed.data.name;
    if (parsed.data.occasionType !== undefined) doc.occasionType = parsed.data.occasionType;
    if (parsed.data.thumbnailUrl !== undefined) doc.thumbnailUrl = parsed.data.thumbnailUrl;
    if (parsed.data.isActive !== undefined) doc.isActive = parsed.data.isActive;
    if (parsed.data.layoutConfig !== undefined) {
      doc.layoutConfig = parsed.data.layoutConfig as unknown as LayoutConfig;
    }
    await doc.save();

    return ok(res, serializeTemplate(doc));
  }),
);

router.delete(
  '/templates/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!isObjectId(id)) return fail(res, 400, 'Invalid template id.', 'INVALID_ID');

    const doc = await Template.findById(id);
    if (!doc) return fail(res, 404, 'টেমপ্লেট পাওয়া যায়নি।', 'NOT_FOUND');

    // Soft-delete so existing posters keep resolving their template.
    doc.isActive = false;
    await doc.save();
    return ok(res, { id, isActive: false });
  }),
);

/* -------------------------------- Posters -------------------------------- */

router.get(
  '/posters',
  asyncHandler(async (req, res) => {
    const status = asString(req.query.status);
    const limitRaw = Number(asString(req.query.limit));
    const offsetRaw = Number(asString(req.query.offset));
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 100;
    const offset = Number.isFinite(offsetRaw) && offsetRaw > 0 ? Math.floor(offsetRaw) : 0;

    const filter: Record<string, unknown> = {};
    if (status && (POSTER_STATUSES as readonly string[]).includes(status)) {
      filter.status = status as PosterStatus;
    }

    const docs = await Poster.find(filter)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);
    return ok(res, docs.map(serializePoster));
  }),
);

/** Delete any user's poster (moderation) along with its stored assets. */
router.delete(
  '/posters/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!isObjectId(id)) return fail(res, 400, 'Invalid poster id.', 'INVALID_ID');

    const poster = await Poster.findById(id);
    if (!poster) return fail(res, 404, 'পোস্টার পাওয়া যায়নি।', 'NOT_FOUND');

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

/* ---------------------------------- Logs ---------------------------------- */

router.get(
  '/logs',
  asyncHandler(async (_req, res) => {
    const docs = await GenerationLog.find({}).sort({ createdAt: -1 }).limit(100);
    return ok(
      res,
      docs.map((doc) => ({
        id: doc.id as string,
        posterId: String(doc.posterId),
        success: doc.success,
        latencyMs: doc.latencyMs,
        tokenEstimate: doc.tokenEstimate ?? 0,
        errorMessage: doc.errorMessage ?? null,
        createdAt: doc.createdAt.toISOString(),
      })),
    );
  }),
);

/** Expose the baseline layout so the admin UI can scaffold new templates. */
router.get('/layout-default', (_req, res) => ok(res, DEFAULT_LAYOUT_CONFIG));

export default router;
