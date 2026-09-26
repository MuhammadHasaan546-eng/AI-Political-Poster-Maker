import { z } from 'zod';
import { OCCASION_TYPES } from '../types/domain';

/**
 * Request validation schemas.
 *
 * Mirrors the frontend contract (`frontend/src/lib/validations.ts`) so the two
 * layers agree on field names and error semantics.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Bangladeshi MSISDN: optional +880 / 880 / 0 prefix then 1[3-9] and 8 digits. */
const BD_PHONE_RE = /^(?:\+?880|0)1[3-9]\d{8}$/;

/**
 * Normalise a login identifier into the unique `email` value the User model
 * stores. Phone numbers are mapped to `<digits>@phone.local` so a single unique
 * index covers both email and mobile sign-ups.
 */
export function normaliseIdentifier(identifier: string): string {
  const value = identifier.trim().toLowerCase();
  if (EMAIL_RE.test(value)) return value;
  const digits = value.replace(/[^\d]/g, '');
  return `${digits}@phone.local`;
}

export const identifierSchema = z
  .string()
  .trim()
  .min(3, { message: 'Enter an email or mobile number.' })
  .refine((value) => EMAIL_RE.test(value.toLowerCase()) || BD_PHONE_RE.test(value), {
    message: 'Enter a valid email or mobile number.',
  });

export const registerSchema = z.object({
  name: z.string().trim().min(2, { message: 'Enter your name.' }),
  identifier: identifierSchema,
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  role: z.enum(['user', 'admin']).optional(),
});

export const loginSchema = z.object({
  identifier: identifierSchema,
  password: z.string().min(1, { message: 'Enter your password.' }),
});

export const posterFormSchema = z.object({
  occasionType: z.enum(OCCASION_TYPES).default('general'),
  headline: z
    .string()
    .trim()
    .min(2, { message: 'Enter a headline.' })
    .max(120, { message: 'Keep the headline within 120 characters.' }),
  name: z.string().trim().min(1, { message: 'Enter your name.' }),
  designation: z.string().trim().min(1, { message: 'Enter a designation.' }),
  organization: z.string().trim().max(120).optional().default(''),
  unionThanaJela: z.string().trim().max(120).optional().default(''),
  partyName: z.string().trim().max(120).optional().default(''),
  promoteBy: z.string().trim().max(160).optional().default(''),
});

export const createPosterSchema = z.object({
  templateId: z.string().trim().min(1, { message: 'Please select a template.' }),
  formData: posterFormSchema,
  uploadedPhotoUrls: z.array(z.string().trim()).max(3).optional().default([]),
});

export const regenerateSchema = z.object({
  /** Optional overrides supplied when re-rolling a poster. */
  overrides: z
    .object({
      fontFamily: z.string().trim().optional(),
      headlineColor: z.string().trim().optional(),
      showMotifs: z.boolean().optional(),
      showFooterBar: z.boolean().optional(),
    })
    .optional(),
});

export const createTemplateSchema = z.object({
  name: z.string().trim().min(2),
  occasionType: z.enum(OCCASION_TYPES),
  thumbnailUrl: z.string().trim().optional().default(''),
  isActive: z.boolean().optional().default(true),
  layoutConfig: z.record(z.string(), z.unknown()),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreatePosterInput = z.infer<typeof createPosterSchema>;
export type PosterFormInput = z.infer<typeof posterFormSchema>;
