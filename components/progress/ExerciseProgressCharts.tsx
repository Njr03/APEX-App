import { Dimensions, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import { estimateOneRepMax } from '@/lib/personalRecords';
import type { ExerciseSessionSummary } from '@/hooks/queries/useExerciseHistory';
import { kgToDisplay, volumeLabel } from '@/lib/units';

interface ExerciseProgressChartsProps {
  sessions: ExerciseSessionSummary[];
  unit: 'kg' | 'lb';
}

export function ExerciseProgressCharts({
  sessions,
  unit,
}: ExerciseProgressChartsProps) {
  const sorted = [...sessions].sort(
    (a, b) =>
      new Date(a.workout_date).getTime() - new Date(b.workout_date).getTime(),
  );

  const recent = sorted.slice(-12);

  if (recent.length === 0) {
    return (
      <Card>
        <AppText variant="muted">
          No completed sets for this exercise yet.
        </AppText>
      </Card>
    );
  }

  const maxWeightData = recent.map((session, index) => ({
    value: session.max_weight,
    label:
      index === 0 || index === recent.length - 1
        ? new Date(session.workout_date).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })
        : '',
  }));

  const est1RmData = recent.map((session, index) => {
    let maxEst = 0;
    for (const set of session.sets) {
      if (set.is_warmup || !set.weight || !set.reps) continue;
      maxEst = Math.max(maxEst, estimateOneRepMax(set.weight, set.reps));
    }

    return {
      value: maxEst,
      label:
        index === 0 || index === recent.length - 1
          ? new Date(session.workout_date).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })
          : '',
    };
  });

  const chartWidth = Math.min(Dimensions.get('window').width - 72, 360);

  return (
    <View className="gap-3">
      <MiniLineChart
        color={colors.accent}
        data={maxWeightData}
        title="Max weight"
        unit={unit}
        width={chartWidth}
      />
      <MiniLineChart
        color={colors.accent2}
        data={est1RmData}
        title="Estimated 1RM"
        unit={unit}
        width={chartWidth}
      />
    </View>
  );
}

function MiniLineChart({
  title,
  data,
  color,
  unit,
  width,
}: {
  title: string;
  data: Array<{ value: number; label: string }>;
  color: string;
  unit: 'kg' | 'lb';
  width: number;
}) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <Card className="gap-2">
      <AppText variant="display">{title}</AppText>
      <AppText variant="muted">{volumeLabel(unit)}</AppText>
      <LineChart
        color={color}
        curved
        data={data}
        dataPointsColor={color}
        dataPointsRadius={3}
        height={150}
        initialSpacing={12}
        maxValue={maxValue * 1.15}
        noOfSections={4}
        spacing={Math.max(24, width / Math.max(data.length, 1))}
        thickness={2}
        width={width}
        xAxisColor={colors.border}
        yAxisColor={colors.border}
        yAxisTextStyle={{ color: colors.muted, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: colors.muted, fontSize: 9 }}
        rulesColor={colors.border}
        formatYLabel={(value) => kgToDisplay(Number(value), unit)}
      />
    </Card>
  );
}
