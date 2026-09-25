/**
 * Domain-level union types — FROZEN CONTRACT for downstream slices.
 *
 * These unions are declared as `as const` tuples so that runtime validation
 * (zod enums, mongoose enums) and compile-time types always stay in sync.
 */

/** Supported poster occasions for the Bangladeshi political poster generator. */
export const OCCASION_TYPES = [
  'general',
  'eid',
  'ramadan',
  'independence-day',
  'victory-day',
  'political-rally',
  'election-campaign',
  'condolence',
  'congratulation',
  'birthday',
] as const;

export type OccasionType = (typeof OCCASION_TYPES)[number];

/** Lifecycle status of a poster generation job. */
export const POSTER_STATUSES = ['pending', 'generating', 'completed', 'failed'] as const;

export type PosterStatus = (typeof POSTER_STATUSES)[number];

/** Application user roles. */
export const USER_ROLES = ['user', 'admin'] as const;

export type UserRole = (typeof USER_ROLES)[number];
