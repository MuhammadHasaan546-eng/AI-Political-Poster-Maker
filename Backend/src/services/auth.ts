import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User, type UserDocument } from '../models';
import { HttpError } from '../middleware/errorHandler';
import type { AuthUser } from '../types/auth';
import type { UserRole } from '../types/domain';
import { normaliseIdentifier } from '../validations/schemas';

/**
 * Authentication service: password hashing, JWT issuance and user projection.
 */

const BCRYPT_ROUNDS = 10;

/** Public representation of a user, safe to return over the wire. */
export interface PublicUser {
  id: string;
  name: string;
  emailOrPhone: string;
  role: UserRole;
}

export function toPublicUser(user: UserDocument): PublicUser {
  return {
    id: user.id as string,
    name: user.name,
    emailOrPhone: user.email,
    role: user.role,
  };
}

/** Hash a plaintext password for storage. */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/** Verify a plaintext password against a stored hash. */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Issue a signed JWT for an authenticated user. */
export function issueToken(user: Pick<UserDocument, 'id' | 'email' | 'role'>): string {
  if (!env.JWT_SECRET) {
    throw new HttpError(503, 'Authentication is not configured (JWT_SECRET missing).', 'AUTH_DISABLED');
  }

  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

/** Register a new user, or throw on duplicate / misconfiguration. */
export async function registerUser(input: {
  name: string;
  identifier: string;
  password: string;
  role?: UserRole;
}): Promise<{ user: PublicUser; token: string }> {
  if (!env.JWT_SECRET) {
    throw new HttpError(503, 'Authentication is not configured (JWT_SECRET missing).', 'AUTH_DISABLED');
  }

  const email = normaliseIdentifier(input.identifier);
  const existing = await User.findOne({ email });
  if (existing) {
    throw new HttpError(409, 'এই ইমেইল/নম্বর দিয়ে ইতিমধ্যে অ্যাকাউন্ট আছে।', 'EMAIL_TAKEN');
  }

  const passwordHash = await hashPassword(input.password);
  const user = await User.create({
    name: input.name,
    email,
    passwordHash,
    role: input.role ?? 'user',
  });

  return { user: toPublicUser(user), token: issueToken(user) };
}

/** Authenticate an existing user, or throw on invalid credentials. */
export async function loginUser(input: {
  identifier: string;
  password: string;
}): Promise<{ user: PublicUser; token: string }> {
  if (!env.JWT_SECRET) {
    throw new HttpError(503, 'Authentication is not configured (JWT_SECRET missing).', 'AUTH_DISABLED');
  }

  const email = normaliseIdentifier(input.identifier);
  // `passwordHash` is `select: false`, so request it explicitly.
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    throw new HttpError(401, 'ভুল ইমেইল/নম্বর অথবা পাসওয়ার্ড।', 'INVALID_CREDENTIALS');
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw new HttpError(401, 'ভুল ইমেইল/নম্বর অথবা পাসওয়ার্ড।', 'INVALID_CREDENTIALS');
  }

  return { user: toPublicUser(user), token: issueToken(user) };
}

/** Load a user by id, or `undefined` when absent. */
export async function findUserById(id: string): Promise<UserDocument | null> {
  return User.findById(id);
}

/** Map an {@link AuthUser} principal to the public projection. */
export function authUserToPublic(user: AuthUser, name: string): PublicUser {
  return { id: user.id, name, emailOrPhone: user.email, role: user.role };
}
