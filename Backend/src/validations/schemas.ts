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
  .min(3, { message: 'ইমেইল বা মোবাইল নম্বর লিখুন।' })
  .refine((value) => EMAIL_RE.test(value.toLowerCase()) || BD_PHONE_RE.test(value), {
    message: 'সঠিক ইমেইল বা মোবাইল নম্বর দিন।',
  });

export const registerSchema = z.object({
  name: z.string().trim().min(2, { message: 'নাম লিখুন।' }),
  identifier: identifierSchema,
  password: z.string().min(6, { message: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' }),
  role: z.enum(['user', 'admin']).optional(),
});

export const loginSchema = z.object({
  identifier: identifierSchema,
  password: z.string().min(1, { message: 'পাসওয়ার্ড দিন।' }),
});

export const posterFormSchema = z.object({
  occasionType: z.enum(OCCASION_TYPES).default('general'),
  headline: z
    .string()
    .trim()
    .min(2, { message: 'শিরোনাম লিখুন।' })
    .max(120, { message: 'শিরোনাম ১২০ অক্ষরের মধ্যে রাখুন।' }),
  name: z.string().trim().min(1, { message: 'নাম লিখুন।' }),
  designation: z.string().trim().min(1, { message: 'পদবি লিখুন।' }),
  organization: z.string().trim().max(120).optional().default(''),
  unionThanaJela: z.string().trim().max(120).optional().default(''),
  partyName: z.string().trim().max(120).optional().default(''),
  promoteBy: z.string().trim().max(160).optional().default(''),
});

export const createPosterSchema = z.object({
  templateId: z.string().trim().min(1, { message: 'টেমপ্লেট নির্বাচন করুন।' }),
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
