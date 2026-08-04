/**
 * Maps Supabase Auth errors to user-friendly messages.
 */
export function getAuthErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object' || !('message' in error)) {
    return 'Something went wrong. Please try again.';
  }

  const message = String((error as { message: string }).message);

  if (message.includes('Email not confirmed')) {
    return 'Please verify your email before signing in.';
  }

  if (
    message.includes('User already registered') ||
    message.includes('already been registered')
  ) {
    return 'An account with this email already exists. Try logging in instead.';
  }

  if (message.includes('username is already taken')) {
    return 'That username is already taken. Choose another one.';
  }

  if (message.includes('No account found for that username')) {
    return 'No account found for that username.';
  }

  if (
    message.includes('schema cache') ||
    message.includes('PGRST202') ||
    message.includes('Could not find the function')
  ) {
    return 'Database setup incomplete. In Supabase SQL Editor, run apex/supabase/migrations/005_usernames.sql, then try again.';
  }

  if (
    message.includes('Database error saving new user') ||
    message.includes('duplicate key') ||
    message.includes('profiles_username')
  ) {
    return 'That username is already taken. Choose another one.';
  }

  if (
    message.includes('rate limit') ||
    message.includes('Rate limit') ||
    message.includes('For security purposes')
  ) {
    const secondsMatch = message.match(/(\d+)\s*seconds?/i);
    const waitHint = secondsMatch
      ? ` Wait about ${secondsMatch[1]} seconds, then try again.`
      : ' Wait a few minutes, then try again.';

    return `Too many signup or login attempts.${waitHint} If you already signed up, use Log In instead — or check your email for a confirmation link.`;
  }

  if (message.includes('Invalid login credentials')) {
    return 'Incorrect email or password.';
  }

  if (
    message.toLowerCase().includes('fetch') ||
    message.toLowerCase().includes('load failed') ||
    message.includes('Network request failed')
  ) {
    return 'Cannot reach Supabase. In the Supabase dashboard (Settings → API), copy the exact Project URL and anon key into apex/.env, confirm the project is active (not deleted/paused), then restart the dev server.';
  }

  return message;
}
