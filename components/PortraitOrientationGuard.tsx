import type { ReactNode } from 'react';
import { Platform, useWindowDimensions, View } from 'react-native';

import { MOBILE_BREAKPOINT } from '@/components/navigation/shellConstants';
import { colors } from '@/constants/theme';
import { usePortraitOrientationLock } from '@/hooks/usePortraitOrientationLock';

function isPhoneSized(width: number, height: number) {
  return Math.min(width, height) < MOBILE_BREAKPOINT;
}

function isLandscape(width: number, height: number) {
  if (width <= height) return false;

  // Mobile keyboards shrink visual height and can falsely read as landscape.
  return width / height >= 1.55;
}

/**
 * Keeps phone layouts portrait-only on web and native.
 * Web uses CSS counter-rotate; native uses the same transform fallback if the OS rotates.
 */
export function PortraitOrientationGuard({ children }: { children: ReactNode }) {
  usePortraitOrientationLock();

  const { width, height } = useWindowDimensions();
  const lockPortraitLayout = isLandscape(width, height) && isPhoneSized(width, height);

  if (!lockPortraitLayout) {
    return <>{children}</>;
  }

  if (Platform.OS === 'web') {
    return (
      <View className="portrait-orientation-lock" style={{ flex: 1 }}>
        <View className="portrait-orientation-lock__content" style={{ flex: 1 }}>
          {children}
        </View>
      </View>
    );
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
