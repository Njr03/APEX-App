import type { PostgrestError } from '@supabase/supabase-js';

/** Throws when Supabase returned an error. Use for DELETE and other no-row responses. */
export function assertSupabaseOk(result: { error: PostgrestError | null }): void {
  if (result.error) {
    throw result.error;
  }
}

/** Use after `.maybeSingle()` when null is a valid outcome (no matching row). */
export function unwrapSupabaseNullable<T>(
  result: { data: T | null; error: PostgrestError | null },
): T | null {
  if (result.error) {
    throw result.error;
  }

  return result.data;
}

export function throwIfSupabaseError<T>(
  result: { data: T | null; error: PostgrestError | null },
): T {
  if (result.error) {
    throw result.error;
  }

  if (result.data === null) {
    throw new Error('No data returned from Supabase');
  }

  return result.data;
}

export function getSupabaseErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'Something went wrong. Please try again.';
  }

  if ('code' in error && error.code === '23503') {
    return 'This exercise is used in a saved workout or session and cannot be deleted.';
  }

  if ('message' in error && typeof error.message === 'string') {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}
