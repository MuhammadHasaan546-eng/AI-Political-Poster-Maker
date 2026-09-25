import { Router } from 'express';
import { requireAdmin } from '../middleware/requireAdmin';
import { GenerationLog, Poster, Template } from '../models';
import { asyncHandler, asString, fail, isObjectId, ok } from '../lib/http';
import { serializePoster, serializeTemplate } from '../lib/serializers';
import { createTemplateSchema } from '../validations/schemas';
import { POSTER_STATUSES } from '../types/domain';
import { DEFAULT_LAYOUT_CONFIG, type LayoutConfig } from '../types/layout';

/** Admin-only template management and poster moderation. */
const router = Router();

// Everything below requires an authenticated admin.
router.use(requireAdmin);

router.get(
  '/templates',
  asyncHandler(async (_req, res) => {
    const docs = await Template.find({}).sort({ createdAt: 1 });
    return ok(res, docs.map(serializeTemplate));
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

router.get(
  '/posters',
  asyncHandler(async (req, res) => {
    const status = asString(req.query.status);
    const filter: Record<string, unknown> = {};
    if (status && (POSTER_STATUSES as readonly string[]).includes(status)) {
      filter.status = status;
    }

    const docs = await Poster.find(filter).sort({ createdAt: -1 }).limit(200);
    return ok(res, docs.map(serializePoster));
  }),
);

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
