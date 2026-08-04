import { Platform, Pressable } from 'react-native';
import { Plus } from 'lucide-react-native';

import { colors } from '@/constants/theme';
import {
  DASHBOARD_WORKOUT_CARD_RADIUS,
  dashboardCardFrameStyle,
} from '@/lib/dashboard/cardStyles';

interface DashboardEmptyCardSlotProps {
  onPress: () => void;
}

export function DashboardEmptyCardSlot({ onPress }: DashboardEmptyCardSlotProps) {
  return (
    <Pressable
      accessibilityHint="Opens workout card picker"
      accessibilityLabel="Add a workout card"
      accessibilityRole="button"
      onPress={onPress}
      style={{
        alignItems: 'center',
        alignSelf: 'stretch',
        backgroundColor: '#0d0d1b',
        borderColor: 'rgba(200,255,90,0.25)',
        borderStyle: 'dashed',
        borderWidth: 1,
        cursor: Platform.OS === 'web' ? ('pointer' as const) : undefined,
        justifyContent: 'center',
        minHeight: 180,
        padding: 24,
        width: '100%',
        ...dashboardCardFrameStyle(DASHBOARD_WORKOUT_CARD_RADIUS),
      }}
    >
      <Plus color={colors.accent} size={28} />
    </Pressable>
  );
}
