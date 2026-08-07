import { format, parseISO } from 'date-fns';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import {
  DashboardDetailModal,
  DashboardDetailRow,
  DashboardDetailSection,
} from '@/components/dashboard/DashboardDetailModal';
import { QueryError } from '@/components/ui/QueryState';
import { colors, fonts } from '@/constants/theme';
import { useExerciseHistory } from '@/hooks/queries/useExerciseHistory';
import type { Exercise } from '@/lib/supabase';
import {
  buildExerciseProgressPoints,
  type ExerciseProgressPoint,
} from '@/lib/progress/exerciseProgressChart';
import { getSupabaseErrorMessage } from '@/lib/supabase/errors';
import { kgToDisplay, weightUnitLabel } from '@/lib/units';

interface ExerciseProgressChartModalProps {
  exercise: Exercise | null;
  unit: 'kg' | 'lb';
  visible: boolean;
  onClose: () => void;
}

const GOLD = '#f5c842';
const MUTED = 'rgba(240,237,232,0.5)';

function ProgressPoint({
  color,
  isPr,
  onPress,
  size,
}: {
  color: string;
  isPr: boolean;
  onPress?: () => void;
  size: number;
}) {
  const dot = (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: isPr ? 'rgba(245,200,66,0.18)' : 'transparent',
        borderColor: color,
        borderRadius: size,
        borderWidth: isPr ? 2 : 0,
        height: size,
        justifyContent: 'center',
        width: size,
      }}
    >
      <View
        style={{
          backgroundColor: color,
          borderRadius: size / 2,
          height: isPr ? size - 4 : 0,
          width: isPr ? size - 4 : 0,
        }}
      />
    </View>
  );

  if (!isPr || !onPress) return dot;

  return (
    <Pressable
      accessibilityLabel="View personal record details"
      accessibilityRole="button"
      hitSlop={10}
      onPress={onPress}
    >
      {dot}
    </Pressable>
  );
}

export function ExerciseProgressChartModal({
  exercise,
  unit,
  visible,
  onClose,
}: ExerciseProgressChartModalProps) {
  const { width: windowWidth } = useWindowDimensions();
  const [selectedPoint, setSelectedPoint] = useState<ExerciseProgressPoint | null>(
    null,
  );

  const {
    data: history,
    isLoading,
    isError,
    error,
    refetch,
  } = useExerciseHistory(visible ? exercise?.id : undefined);

  const points = useMemo(
    () => buildExerciseProgressPoints(history?.sessions ?? []),
    [history?.sessions],
  );

  const chartWidth = Math.min(windowWidth - 88, 420);
  const maxValue = Math.max(...points.map((point) => point.value), 1);

  const chartData = points.map((point) => ({
    value: point.value,
    label: point.label,
    dataPointColor: point.isPr ? GOLD : colors.accent,
    dataPointRadius: point.isPr ? 0 : 0,
    hideDataPoint: !point.isPr,
    onPress: point.isPr
      ? () => {
          setSelectedPoint(point);
        }
      : undefined,
  }));

  const handleClose = () => {
    setSelectedPoint(null);
    onClose();
  };

  return (
    <DashboardDetailModal
      eyebrow="Exercise progress"
      eyebrowColor={colors.accent}
      onClose={handleClose}
      subtitle={`Max weight progression · ${weightUnitLabel(unit)}`}
      title={exercise?.name ?? 'Exercise'}
      visible={visible}
    >
      {isLoading ? (
        <View className="items-center py-8">
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : null}

      {isError ? (
        <QueryError
          message={getSupabaseErrorMessage(error)}
          onRetry={() => void refetch()}
        />
      ) : null}

      {!isLoading && !isError && points.length === 0 ? (
        <DashboardDetailSection title="Progression">
          <Text style={{ color: MUTED, fontFamily: fonts.body, fontSize: 12 }}>
            No completed sets for this exercise yet.
          </Text>
        </DashboardDetailSection>
      ) : null}

      {!isLoading && !isError && points.length > 0 ? (
        <>
          <DashboardDetailSection title="Weight progression">
            <Text style={{ color: MUTED, fontFamily: fonts.body, fontSize: 11 }}>
              Gold dots mark personal records. Tap a dot for details.
            </Text>
            <View style={{ marginTop: 8, overflow: 'hidden' }}>
              <LineChart
                color={colors.accent}
                curved
                customDataPoint={(_item: { value: number }, index: number) => {
                  const point = points[index];
                  if (!point) return null;

                  return (
                    <ProgressPoint
                      color={point.isPr ? GOLD : colors.accent}
                      isPr={point.isPr}
                      onPress={
                        point.isPr
                          ? () => {
                              setSelectedPoint(point);
                            }
                          : undefined
                      }
                      size={point.isPr ? 16 : 8}
                    />
                  );
                }}
                data={chartData}
                dataPointsColor={colors.accent}
                dataPointsRadius={0}
                formatYLabel={(value) => kgToDisplay(Number(value), unit)}
                height={180}
                hideDataPoints
                initialSpacing={16}
                maxValue={maxValue * 1.15}
                noOfSections={4}
                rulesColor={colors.border}
                spacing={Math.max(28, chartWidth / Math.max(points.length, 1))}
                thickness={2}
                width={chartWidth}
                xAxisColor={colors.border}
                xAxisLabelTextStyle={{ color: colors.muted, fontSize: 9 }}
                yAxisColor={colors.border}
                yAxisTextStyle={{ color: colors.muted, fontSize: 10 }}
              />
            </View>
          </DashboardDetailSection>

          {selectedPoint?.isPr && selectedPoint.prSet ? (
            <DashboardDetailSection title="PR details">
              <DashboardDetailRow
                label="Weight"
                value={`${kgToDisplay(selectedPoint.prSet.weight ?? 0, unit)} ${weightUnitLabel(unit)}`}
                valueColor={GOLD}
              />
              <DashboardDetailRow
                label="Reps"
                value={`${selectedPoint.prSet.reps ?? '—'}`}
              />
              <DashboardDetailRow
                label="Workout"
                value={selectedPoint.session.workout_name}
              />
              <DashboardDetailRow
                label="Date"
                value={format(
                  parseISO(selectedPoint.session.workout_date),
                  'EEEE, MMM d, yyyy',
                )}
              />
            </DashboardDetailSection>
          ) : (
            <Text style={{ color: MUTED, fontFamily: fonts.body, fontSize: 11 }}>
              Tap a gold PR dot to inspect that set.
            </Text>
          )}
        </>
      ) : null}
    </DashboardDetailModal>
  );
}
