import { z } from 'zod';

export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be 20 characters or less')
  .regex(
    /^[a-zA-Z0-9_]+$/,
    'Username can only contain letters, numbers, and underscores',
  )
  .transform((value) => value.toLowerCase());

/** Profile edits: only require a non-empty username. */
export const profileUsernameSchema = z
  .string()
  .trim()
  .min(1, 'Username cannot be empty.')
  .transform((value) => value.toLowerCase());

export function normalizeUsername(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

export function isEmailIdentifier(value: string): boolean {
  return value.trim().includes('@');
}
