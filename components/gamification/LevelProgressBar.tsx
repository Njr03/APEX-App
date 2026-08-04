import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { xpProgressInLevel } from '@/lib/xp';

interface LevelProgressBarProps {
  totalXp: number;
  compact?: boolean;
}

export function LevelProgressBar({
  totalXp,
  compact = false,
}: LevelProgressBarProps) {
  const { level, current, needed, percent } = xpProgressInLevel(totalXp);

  return (
    <View className="gap-2">
      <View className="flex-row items-end justify-between">
        <View>
          <AppText className={compact ? 'text-sm' : 'text-base'} variant="muted">
            Level
          </AppText>
          <AppText
            className={compact ? 'text-2xl text-gold' : 'text-3xl text-gold'}
            variant="display"
          >
            {level}
          </AppText>
        </View>
        <AppText variant="mono">
          {current}/{needed} XP
        </AppText>
      </View>

      <View className="h-2 overflow-hidden rounded-full bg-surface2">
        <View
          className="h-full rounded-full bg-accent"
          style={{ width: `${percent}%` }}
        />
      </View>

      {!compact ? (
        <AppText className="text-xs" variant="muted">
          {totalXp} total XP · next level at {(level + 1) * (level + 1) * 100} XP
        </AppText>
      ) : null}
    </View>
  );
}
