import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { getAuthRedirectUrl } from '@/lib/auth/redirect';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

function parseAuthParams(url: string) {
  const queryString = url.includes('?')
    ? url.split('?')[1]?.split('#')[0] ?? ''
    : '';
  const hashString = url.includes('#') ? url.split('#')[1] ?? '' : '';
  const params = new URLSearchParams(queryString || hashString);

  return {
    code: params.get('code'),
    accessToken: params.get('access_token'),
    refreshToken: params.get('refresh_token'),
  };
}

export async function signInWithGoogle(): Promise<void> {
  const redirectTo = getAuthRedirectUrl('auth/callback');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: Platform.OS !== 'web',
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  });

  if (error) throw error;

  if (Platform.OS === 'web') {
    if (data.url) {
      window.location.assign(data.url);
    }
    return;
  }

  if (!data.url) {
    throw new Error('Could not start Google sign-in.');
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type !== 'success') {
    throw new Error('Google sign-in was cancelled.');
  }

  const { code, accessToken, refreshToken } = parseAuthParams(result.url);

  if (code) {
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) throw exchangeError;
    return;
  }

  if (accessToken && refreshToken) {
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (sessionError) throw sessionError;
    return;
  }

  throw new Error('Google sign-in did not return a session.');
}
