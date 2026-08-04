import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export async function getPlatformItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

export async function setPlatformItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}
