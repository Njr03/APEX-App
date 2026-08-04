import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { colors } from '@/constants/theme';
import { getAuthErrorMessage } from '@/lib/auth/errors';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackScreen() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const finishAuth = async () => {
      try {
        const url = typeof window !== 'undefined' ? window.location.href : '';
        const code = new URL(url).searchParams.get('code');

        if (code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!mounted) return;

        if (session) {
          router.replace('/(tabs)');
          return;
        }

        setError('Sign-in could not be completed. Please try again.');
      } catch (err) {
        if (mounted) {
          setError(getAuthErrorMessage(err));
        }
      }
    };

    void finishAuth();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Screen className="items-center justify-center px-6">
      {error ? (
        <>
          <AppText className="text-center text-accent3" variant="body">
            {error}
          </AppText>
          <AppText
            className="mt-4 text-center text-accent"
            onPress={() => router.replace('/(auth)/login')}
            variant="body"
          >
            Back to login
          </AppText>
        </>
      ) : (
        <View className="items-center gap-3">
          <ActivityIndicator color={colors.accent} size="large" />
          <AppText variant="muted">Finishing sign-in…</AppText>
        </View>
      )}
    </Screen>
  );
}
