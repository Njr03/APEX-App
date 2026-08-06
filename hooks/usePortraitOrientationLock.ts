import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect } from 'react';
import { Platform } from 'react-native';

async function lockPortraitOrientation() {
  try {
    await ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT_UP,
    );
  } catch {
    // Some mobile browsers block orientation lock outside installed PWAs.
  }

  if (Platform.OS === 'web' && typeof screen !== 'undefined') {
    const orientation = screen.orientation as {
      lock?: (orientation: string) => Promise<void>;
    };

    try {
      await orientation.lock?.('portrait');
    } catch {
      // Ignore unsupported or permission-denied lock attempts.
    }
  }
}

export function usePortraitOrientationLock() {
  useEffect(() => {
    void lockPortraitOrientation();

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const retryLock = () => {
        void lockPortraitOrientation();
      };

      window.addEventListener('orientationchange', retryLock);
      document.addEventListener('visibilitychange', retryLock);

      return () => {
        window.removeEventListener('orientationchange', retryLock);
        document.removeEventListener('visibilitychange', retryLock);
      };
    }

    return () => {
      if (Platform.OS !== 'web') {
        void ScreenOrientation.unlockAsync();
      }
    };
  }, []);
}
