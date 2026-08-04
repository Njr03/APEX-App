import { router, type Href } from 'expo-router';
import { Pressable } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/theme';

interface BackButtonProps {
  label?: string;
  className?: string;
  fallbackHref?: Href;
}

export function navigateBack(fallbackHref: Href = '/(tabs)') {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallbackHref);
  }
}

export function BackButton({
  label = 'Back',
  className,
  fallbackHref = '/(tabs)',
}: BackButtonProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      className={`flex-row items-center gap-2 self-start active:opacity-70 ${className ?? ''}`}
      onPress={() => navigateBack(fallbackHref)}
    >
      <ArrowLeft color={colors.muted} size={18} />
      <AppText variant="muted">{label}</AppText>
    </Pressable>
  );
}
