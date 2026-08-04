import { format, parseISO } from 'date-fns';
import { Dimensions, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import type { WeeklyVolumeBucket } from '@/lib/progress/stats';
import { kgToDisplay, volumeLabel } from '@/lib/units';

interface WeeklyVolumeChartProps {
  data: WeeklyVolumeBucket[];
  unit: 'kg' | 'lb';
}

export function WeeklyVolumeChart({ data, unit }: WeeklyVolumeChartProps) {
  const chartWidth = Math.min(Dimensions.get('window').width - 72, 360);
  const maxValue = Math.max(...data.map((d) => d.volume), 1);

  const chartData = data.map((bucket) => ({
    value: bucket.volume,
    label: bucket.label,
    frontColor: colors.accent,
  }));

  return (
    <Card className="gap-3">
      <AppText variant="display">Weekly volume</AppText>
      <AppText variant="muted">Last 12 weeks ({volumeLabel(unit)})</AppText>
      <View className="overflow-hidden rounded-lg">
        <BarChart
          barBorderRadius={4}
          barWidth={16}
          data={chartData}
          height={180}
          initialSpacing={12}
          maxValue={maxValue * 1.15}
          noOfSections={4}
          spacing={Math.max(8, chartWidth / Math.max(chartData.length, 1) - 18)}
          width={chartWidth}
          xAxisColor={colors.border}
          yAxisColor={colors.border}
          yAxisTextStyle={{ color: colors.muted, fontSize: 10 }}
          xAxisLabelTextStyle={{ color: colors.muted, fontSize: 9 }}
          rulesColor={colors.border}
          renderTooltip={(item: { value: number }) => (
            <View className="rounded-md bg-surface2 px-2 py-1">
              <AppText className="text-xs" variant="mono">
                {kgToDisplay(item.value, unit)} {volumeLabel(unit)}
              </AppText>
            </View>
          )}
        />
      </View>
    </Card>
  );
}

interface StreakHeatmapProps {
  days: Array<{ date: string; count: number; volume: number }>;
}

export function StreakHeatmap({ days }: StreakHeatmapProps) {
  const maxVolume = Math.max(...days.map((d) => d.volume), 1);

  return (
    <Card className="gap-3">
      <AppText variant="display">Training heatmap</AppText>
      <AppText variant="muted">Last ~3 months — darker = more volume</AppText>
      <View className="flex-row flex-wrap gap-1">
        {days.map((day) => {
          const intensity =
            day.volume <= 0 ? 0 : Math.min(1, day.volume / maxVolume);
          const alpha = day.count > 0 ? 0.15 + intensity * 0.85 : 0.08;

          return (
            <View
              key={day.date}
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: `rgba(200, 255, 90, ${alpha})` }}
            />
          );
        })}
      </View>
      <AppText className="text-xs" variant="muted">
        {format(parseISO(days[0]?.date ?? new Date().toISOString()), 'MMM d')} –{' '}
        {format(
          parseISO(days[days.length - 1]?.date ?? new Date().toISOString()),
          'MMM d',
        )}
      </AppText>
    </Card>
  );
}
