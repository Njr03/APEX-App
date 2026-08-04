import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { supabase } from '@/lib/supabase';

/**
 * Handles Supabase auth deep-link events that require navigation
 * (e.g. password recovery from email link).
 */
export function AuthNavigationHandler() {
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.replace('/reset-password');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return null;
}
