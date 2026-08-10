import { Text, type TextProps } from 'react-native';

import { APP_TEXT_TRANSFORM, fonts } from '@/constants/theme';
import { cn } from '@/lib/cn';

type AppTextVariant = 'body' | 'display' | 'mono' | 'muted';

interface AppTextProps extends TextProps {
  variant?: AppTextVariant;
  className?: string;
}

const variantStyles: Record<AppTextVariant, string> = {
  body: 'font-body text-text',
  display: 'font-display text-text',
  mono: 'font-mono text-text',
  muted: 'font-body text-muted',
};

export function AppText({
  variant = 'body',
  className,
  style,
  ...props
}: AppTextProps) {
  return (
    <Text
      className={cn(variantStyles[variant], className)}
      style={[{ fontFamily: getFontFamily(variant) }, APP_TEXT_TRANSFORM, style]}
      {...props}
    />
  );
}

function getFontFamily(variant: AppTextVariant): string {
  switch (variant) {
    case 'display':
      return fonts.display;
    case 'mono':
      return fonts.mono;
    default:
      return fonts.body;
  }
}
