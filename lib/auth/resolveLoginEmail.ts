import { throwIfSupabaseError } from '@/lib/supabase/errors';
import { supabase } from '@/lib/supabase';
import { isEmailIdentifier } from '@/lib/auth/username';

/** Resolve a login identifier (username or email) to an auth email address. */
export async function resolveLoginEmail(identifier: string): Promise<string> {
  const trimmed = identifier.trim();

  if (!trimmed) {
    throw new Error('Enter your username or email.');
  }

  if (isEmailIdentifier(trimmed)) {
    return trimmed.toLowerCase();
  }

  const result = await supabase.rpc('resolve_login_email', {
    identifier: trimmed,
  });

  if (result.error) throw result.error;

  if (!result.data) {
    throw new Error('No account found for that username.');
  }

  return result.data;
}

/** Returns true when the username is not taken. */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const result = await supabase.rpc('is_username_available', {
    username_input: username,
  });

  return Boolean(throwIfSupabaseError(result));
}
