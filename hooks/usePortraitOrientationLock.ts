import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect } from 'react';
import { Platform } from 'react-native';

async function lockPortraitOrientation() {
  if (Platform.OS !== 'web') {
    try {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      );
    } catch {
      // Ignore unsupported lock attempts.
    }
    return;
  }

  if (typeof screen === 'undefined') return;

  const orientation = screen.orientation as {
    lock?: (orientation: string) => Promise<void>;
  };

  try {
    await orientation.lock?.('portrait-primary');
  } catch {
    try {
      await orientation.lock?.('portrait');
    } catch {
      // Some mobile browsers block orientation lock outside installed PWAs.
    }
  }
}

export function usePortraitOrientationLock() {
  useEffect(() => {
    void lockPortraitOrientation();

    if (Platform.OS !== 'web') {
      const subscription = ScreenOrientation.addOrientationChangeListener(() => {
        void lockPortraitOrientation();
      });

      return () => {
        subscription.remove();
      };
    }

    if (typeof window === 'undefined') return;

    const retryLock = () => {
      void lockPortraitOrientation();
    };

    window.addEventListener('orientationchange', retryLock);
    window.addEventListener('resize', retryLock);
    document.addEventListener('visibilitychange', retryLock);

    return () => {
      window.removeEventListener('orientationchange', retryLock);
      window.removeEventListener('resize', retryLock);
      document.removeEventListener('visibilitychange', retryLock);
    };
  }, []);
}
