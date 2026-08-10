import { Image, View, type StyleProp, type ViewStyle } from 'react-native';

import { APEX_LOGO_BACKGROUND } from '@/constants/theme';

const LOGO_SOURCE = require('@/assets/images/apex-logo.png');
const LOGO_ASPECT = 764 / 732;

export { APEX_LOGO_BACKGROUND };

interface ApexLogoProps {
  height?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function ApexLogo({
  height = 22,
  style,
  accessibilityLabel = 'APEX',
}: ApexLogoProps) {
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
      style={[{ height, width: height * LOGO_ASPECT }, style]}
    >
      <Image
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        resizeMode="contain"
        source={LOGO_SOURCE}
        style={{ height: '100%', width: '100%' }}
      />
    </View>
  );
}
