import { Text as RNText, type TextProps, type TextStyle } from 'react-native';

import { APP_TEXT_TRANSFORM } from '@/constants/theme';

export function Text({ style, ...props }: TextProps) {
  return <RNText {...props} style={[APP_TEXT_TRANSFORM as TextStyle, style]} />;
}
