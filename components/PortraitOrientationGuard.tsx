import type { ReactNode } from 'react';
import { Platform, useWindowDimensions, View } from 'react-native';

import { MOBILE_BREAKPOINT } from '@/components/navigation/shellConstants';
import { colors } from '@/constants/theme';
import { usePortraitOrientationLock } from '@/hooks/usePortraitOrientationLock';

function isPhoneLayout(width: number, height: number) {
  return Math.min(width, height) < MOBILE_BREAKPOINT;
}

/**
 * Keeps phone layouts portrait-only. Web uses CSS in +html.tsx; native relies on
 * expo-screen-orientation with a transform fallback if the OS still rotates.
 */
export function PortraitOrientationGuard({ children }: { children: ReactNode }) {
  usePortraitOrientationLock();

  const { width, height } = useWindowDimensions();
  const isLandscapePhone =
    Platform.OS !== 'web' && width > height && isPhoneLayout(width, height);

  if (!isLandscapePhone) {
    return <>{children}</>;
  }

  return (
    <View
      style={{
        backgroundColor: colors.bg,
        height,
        overflow: 'hidden',
        width,
      }}
    >
      <View
        style={{
          height: width,
          transform: [{ rotate: '90deg' }, { translateX: height }],
          width: height,
        }}
      >
        {children}
      </View>
    </View>
  );
}
