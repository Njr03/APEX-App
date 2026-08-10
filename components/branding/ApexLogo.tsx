import { Image, View, type StyleProp, type ViewStyle } from 'react-native';

const LOGO_SOURCE = require('@/assets/images/apex-logo.png');
const LOGO_ASPECT = 764 / 732;

export const APEX_LOGO_BACKGROUND = '#000000';

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
