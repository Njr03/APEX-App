import { Smartphone } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { MOBILE_BREAKPOINT } from '@/components/navigation/shellConstants';
import { colors, fonts } from '@/constants/theme';
import { usePortraitOrientationLock } from '@/hooks/usePortraitOrientationLock';

function isPhoneLayout(width: number, height: number) {
  return Math.min(width, height) < MOBILE_BREAKPOINT;
}

export function PortraitOrientationGuard({ children }: { children: ReactNode }) {
  usePortraitOrientationLock();

  const { width, height } = useWindowDimensions();
  const isLandscapePhone = width > height && isPhoneLayout(width, height);

  if (isLandscapePhone) {
    return (
      <View
        style={{
          alignItems: 'center',
          backgroundColor: colors.bg,
          flex: 1,
          justifyContent: 'center',
          paddingHorizontal: 32,
        }}
      >
        <Smartphone color={colors.accent} size={40} />
        <AppText
          style={{
            fontFamily: fonts.brand,
            fontSize: 22,
            fontWeight: '700',
            marginTop: 20,
            textAlign: 'center',
          }}
          variant="display"
        >
          Rotate to portrait
        </AppText>
        <AppText
          style={{ marginTop: 10, textAlign: 'center' }}
          variant="muted"
        >
          APEX is designed for portrait mode. Turn your phone upright to continue
          your workout.
        </AppText>
      </View>
    );
  }

  return children;
}
