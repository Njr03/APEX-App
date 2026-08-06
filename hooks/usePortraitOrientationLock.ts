import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect } from 'react';
import { Platform } from 'react-native';

export function usePortraitOrientationLock() {
  useEffect(() => {
    void ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT_UP,
    ).catch(() => {
      // Some mobile browsers block orientation lock outside installed PWAs.
    });

    return () => {
      if (Platform.OS !== 'web') {
        void ScreenOrientation.unlockAsync();
      }
    };
  }, []);
}
