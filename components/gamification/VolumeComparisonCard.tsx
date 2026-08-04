import { TrendingDown, TrendingUp } from 'lucide-react-native';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import type { VolumeComparison } from '@/lib/dashboard/stats';
import { kgToDisplay, volumeLabel } from '@/lib/units';

interface VolumeComparisonCardProps {
  comparison: VolumeComparison;
  unit: 'kg' | 'lb';
}

export function VolumeComparisonCard({
  comparison,
  unit,
}: VolumeComparisonCardProps) {
  const { thisWeek, lastWeek, delta, deltaPercent } = comparison;
  const isUp = delta >= 0;
  const TrendIcon = isUp ? TrendingUp : TrendingDown;
  const trendColor = isUp ? colors.accent : colors.accent3;

  return (
    <Card className="gap-3">
      <AppText variant="muted">This week vs last week</AppText>
      <View className="flex-row items-end justify-between">
        <View>
          <AppText className="text-2xl" variant="mono">
            {kgToDisplay(thisWeek, unit)} {volumeLabel(unit)}
          </AppText>
          <AppText className="mt-1" variant="muted">
            Last week: {kgToDisplay(lastWeek, unit)} {volumeLabel(unit)}
          </AppText>
        </View>
        <View className="flex-row items-center gap-1">
          <TrendIcon color={trendColor} size={18} />
          <AppText style={{ color: trendColor }} variant="mono">
            {isUp ? '+' : ''}
            {kgToDisplay(delta, unit)}
          </AppText>
        </View>
      </View>
      {deltaPercent != null ? (
        <AppText className="text-sm" variant="muted">
          {isUp ? '+' : ''}
          {deltaPercent}% vs last week
        </AppText>
      ) : null}
    </Card>
  );
}
