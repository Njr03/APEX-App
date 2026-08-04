import { Flame } from 'lucide-react-native';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import type { StreakDisplayState } from '@/lib/streak';

interface StreakCardProps {
  streakState: StreakDisplayState;
  longestStreak?: number;
}

export function StreakCard({ streakState, longestStreak }: StreakCardProps) {
  const statusColor =
    streakState.status === 'active'
      ? colors.gold
      : streakState.status === 'at_risk'
        ? colors.accent3
        : colors.muted;

  return (
    <Card className="gap-3">
      <View className="flex-row items-center gap-4">
        <Flame color={statusColor} size={40} />
        <View className="flex-1">
          <AppText className="text-4xl" style={{ color: statusColor }} variant="mono">
            {streakState.streak}
          </AppText>
          <AppText variant="muted">Day streak</AppText>
        </View>
        {longestStreak != null && longestStreak > 0 ? (
          <View className="items-end">
            <AppText variant="muted">Best</AppText>
            <AppText className="text-gold" variant="mono">
              {longestStreak}
            </AppText>
          </View>
        ) : null}
      </View>
      <AppText
        className={streakState.status === 'at_risk' ? 'text-accent3' : ''}
        variant="body"
      >
        {streakState.message}
      </AppText>
    </Card>
  );
}
