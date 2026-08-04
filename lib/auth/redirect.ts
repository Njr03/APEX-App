import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

/**
 * Builds the redirect URL Supabase uses after OAuth / email flows.
 * Native: apex://auth/callback
 * Web: http://localhost:8081/auth/callback (or EXPO_PUBLIC_SITE_URL)
 */
export function getAuthRedirectUrl(path = ''): string {
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const base =
      process.env.EXPO_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
      window.location.origin;
    return `${base}/${normalizedPath}`;
  }

  return Linking.createURL(normalizedPath);
}

/** Supabase callback URL to register in Google Cloud Console. */
export function getSupabaseGoogleRedirectUri(): string | null {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    const host = new URL(url).hostname.split('.')[0];
    return `https://${host}.supabase.co/auth/v1/callback`;
  } catch {
    return null;
  }
}
