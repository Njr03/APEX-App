import { router } from 'expo-router';
import { Pressable } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/theme';

interface BackToDashboardButtonProps {
  label?: string;
  className?: string;
}

export function navigateToDashboard() {
  router.replace('/(tabs)');
}

export function BackToDashboardButton({
  label = 'Back to Dashboard',
  className,
}: BackToDashboardButtonProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      className={`flex-row items-center gap-2 self-start active:opacity-70 ${className ?? ''}`}
      onPress={navigateToDashboard}
    >
      <ArrowLeft color={colors.muted} size={18} />
      <AppText variant="muted">{label}</AppText>
    </Pressable>
  );
}
