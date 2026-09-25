import { Router } from 'express';
import { Template } from '../models';
import { OCCASION_TYPES, type OccasionType } from '../types/domain';
import { asyncHandler, asString, fail, isObjectId, ok } from '../lib/http';
import { serializeTemplate } from '../lib/serializers';

/** Public, read-only template library. */
const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const occasion = asString(req.query.occasionType);
    const filter: Record<string, unknown> = { isActive: true };
    if (occasion && (OCCASION_TYPES as readonly string[]).includes(occasion)) {
      filter.occasionType = occasion as OccasionType;
    }

    const docs = await Template.find(filter).sort({ createdAt: 1 });
    return ok(res, docs.map(serializeTemplate));
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!isObjectId(id)) return fail(res, 400, 'Invalid template id.', 'INVALID_ID');

    const doc = await Template.findById(id);
    if (!doc) return fail(res, 404, 'টেমপ্লেট পাওয়া যায়নি।', 'NOT_FOUND');
    return ok(res, serializeTemplate(doc));
  }),
);

export default router;
