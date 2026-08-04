import { Dimensions, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import type { DailyVolumePoint } from '@/lib/dashboard/stats';
import { kgToDisplay, volumeLabel } from '@/lib/units';

interface DailyVolumeMiniChartProps {
  data: DailyVolumePoint[];
  unit: 'kg' | 'lb';
}

export function DailyVolumeMiniChart({
  data,
  unit,
}: DailyVolumeMiniChartProps) {
  const chartWidth = Math.min(Dimensions.get('window').width - 72, 360);
  const maxValue = Math.max(...data.map((d) => d.volume), 1);

  const chartData = data.map((point) => ({
    value: point.volume,
    label: point.label,
    frontColor: point.volume > 0 ? colors.accent : colors.surface2,
  }));

  return (
    <Card className="gap-3">
      <AppText variant="display">Last 7 days</AppText>
      <AppText variant="muted">Training volume ({volumeLabel(unit)})</AppText>
      <View className="overflow-hidden rounded-lg">
        <BarChart
          barBorderRadius={4}
          barWidth={18}
          data={chartData}
          height={120}
          initialSpacing={10}
          maxValue={maxValue * 1.2}
          noOfSections={3}
          spacing={Math.max(8, (chartWidth - 40) / Math.max(chartData.length, 1) - 18)}
          width={chartWidth}
          xAxisColor={colors.border}
          yAxisColor={colors.border}
          yAxisTextStyle={{ color: colors.muted, fontSize: 9 }}
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
