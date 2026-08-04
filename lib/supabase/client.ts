import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { Database } from './database.types';
import { supabaseEnv } from './env';

const SECURE_STORE_KEY = 'apex-supabase-auth';

/**
 * Secure token storage for native platforms.
 * Web uses Supabase's default localStorage handling — no custom wrapper.
 */
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient<Database>(
  supabaseEnv.EXPO_PUBLIC_SUPABASE_URL,
  supabaseEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: Platform.OS === 'web' ? undefined : ExpoSecureStoreAdapter,
      storageKey: SECURE_STORE_KEY,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
    },
  },
);
