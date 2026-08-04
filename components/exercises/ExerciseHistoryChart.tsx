import { Dimensions, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import { kgToDisplay } from '@/lib/units';

interface ExerciseHistoryChartProps {
  data: Array<{ date: string; maxWeight: number }>;
  unit: 'kg' | 'lb';
}

export function ExerciseHistoryChart({
  data,
  unit,
}: ExerciseHistoryChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <AppText variant="muted">
          Log completed sets to see your weight progression.
        </AppText>
      </Card>
    );
  }

  const chartWidth = Math.min(Dimensions.get('window').width - 72, 360);
  const maxValue = Math.max(...data.map((d) => d.maxWeight), 1);

  const chartData = data.map((point, index) => ({
    value: point.maxWeight,
    label:
      index === 0 || index === data.length - 1
        ? new Date(point.date).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })
        : '',
    dataPointText: kgToDisplay(point.maxWeight, unit),
  }));

  return (
    <Card className="gap-3">
      <AppText variant="display">Weight progression</AppText>
      <AppText variant="muted">Max weight per session ({unit})</AppText>
      <View className="overflow-hidden rounded-lg">
        <LineChart
          areaChart
          color={colors.accent}
          curved
          data={chartData}
          dataPointsColor={colors.accent}
          dataPointsRadius={4}
          height={180}
          initialSpacing={16}
          maxValue={maxValue * 1.15}
          noOfSections={4}
          spacing={Math.max(28, chartWidth / Math.max(chartData.length, 1))}
          startFillColor={colors.accent}
          startOpacity={0.2}
          endFillColor={colors.accent}
          endOpacity={0.02}
          thickness={2}
          width={chartWidth}
          xAxisColor={colors.border}
          yAxisColor={colors.border}
          yAxisTextStyle={{ color: colors.muted, fontSize: 10 }}
          xAxisLabelTextStyle={{ color: colors.muted, fontSize: 10 }}
          rulesColor={colors.border}
          yAxisTextNumberOfLines={1}
        />
      </View>
    </Card>
  );
}
