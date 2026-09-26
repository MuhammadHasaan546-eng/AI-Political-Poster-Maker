import { z } from "zod";
import { OCCASION_TYPES } from "./types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Bangladeshi MSISDN: optional +880 / 880 / 0 prefix then 1[3-9] and 8 digits. */
const BD_PHONE_RE = /^(?:\+?880|0)1[3-9]\d{8}$/;

const emailOrPhone = z
  .string()
  .trim()
  .min(3, { message: "Enter an email or mobile number." })
  .refine((value) => EMAIL_RE.test(value) || BD_PHONE_RE.test(value), {
    message: "Enter a valid email or mobile number.",
  });

export const loginSchema = z.object({
  identifier: emailOrPhone,
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, { message: "Enter your name." }),
    identifier: emailOrPhone,
    password: z.string().min(6, { message: "Password must be at least 6 characters." }),
    confirmPassword: z.string(),
    role: z.enum(["user", "admin"]).default("user"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "The passwords do not match.",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const posterFormSchema = z.object({
  occasionType: z.enum(OCCASION_TYPES),
  headline: z
    .string()
    .trim()
    .min(2, { message: "Enter a headline." })
    .max(120, { message: "Keep the headline within 120 characters." }),
  name: z.string().trim().min(2, { message: "Enter your name." }),
  designation: z.string().trim().min(2, { message: "Enter a designation." }),
  organization: z.string().trim().max(120).default(""),
  unionThanaJela: z.string().trim().max(120).default(""),
  partyName: z.string().trim().max(120).default(""),
  promoteBy: z.string().trim().max(160).default(""),
});

export type PosterFormValues = z.infer<typeof posterFormSchema>;
