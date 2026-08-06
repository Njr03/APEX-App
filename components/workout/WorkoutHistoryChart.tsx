import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { format, parseISO } from 'date-fns';
import { X } from 'lucide-react-native';

import { WorkoutCalendar } from '@/components/history/WorkoutCalendar';
import { InsightSectionHeading } from '@/components/dashboard/InsightSectionHeading';
import { QueryError } from '@/components/ui/QueryState';
import { useWorkoutHistory } from '@/hooks/queries';
import { useThisWeekSplits } from '@/hooks/useThisWeekSplits';
import { formatElapsedDuration } from '@/hooks/useWorkoutTimer';
import { colors, fonts } from '@/constants/theme';
import {
  inferSplitFromWorkoutName,
  SPLIT_DEFINITIONS,
} from '@/lib/training/splits';
import { buildCalendarDayMarkers } from '@/lib/training/scheduledSessions';
import { workoutsOnDate } from '@/lib/progress/stats';
import { useLayoutBreakpoint } from '@/hooks/useLayoutBreakpoint';
import { getSupabaseErrorMessage } from '@/lib/supabase/errors';
import type { Workout } from '@/lib/supabase';
import {
  buildWorkoutHistoryChart,
  HISTORY_CHART,
  historyHourFractions,
  historyHourLabels,
  type WorkoutHistoryPoint,
} from '@/lib/workout/workoutHistoryChart';

const CARD_BG = '#141427';
const CARD_BORDER = 'rgba(255,255,255,0.06)';
const GRID = 'rgba(255,255,255,0.06)';
const MUTED = 'rgba(240,237,232,0.5)';

const PANEL_STYLE = {
  backgroundColor: CARD_BG,
  borderColor: CARD_BORDER,
  borderRadius: 12,
  borderWidth: 1,
  gap: 12,
  padding: 16,
} as const;

const LEGEND = [
  { label: 'Upper A', color: '#ff8c42' },
  { label: 'Upper B', color: '#38d9f5' },
  { label: 'Legs', color: '#b06bff' },
  { label: 'Other', color: colors.accent },
];

function SessionDetailModal({
  workout,
  visible,
  onClose,
}: {
  workout: Workout | null;
  visible: boolean;
  onClose: () => void;
}) {
  if (!workout) return null;

  const split = inferSplitFromWorkoutName(workout.name);
  const splitColor = split ? SPLIT_DEFINITIONS[split].color : colors.accent;
  const started = parseISO(workout.started_at);
  const completed = workout.completed_at ? parseISO(workout.completed_at) : null;

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <Pressable
        className="flex-1 items-center justify-center px-5"
        style={{ backgroundColor: 'rgba(0,0,0,0.72)' }}
        onPress={onClose}
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={{
            backgroundColor: '#0d0d1b',
            borderColor: CARD_BORDER,
            borderRadius: 16,
            borderWidth: 1,
            gap: 14,
            maxWidth: 360,
            padding: 18,
            width: '100%',
          }}
        >
          <View className="flex-row items-start justify-between" style={{ gap: 12 }}>
            <View style={{ flex: 1, gap: 6 }}>
              <View className="flex-row items-center" style={{ gap: 8 }}>
                <View
                  style={{
                    backgroundColor: splitColor,
                    borderRadius: 999,
                    height: 8,
                    width: 8,
                  }}
                />
                <Text
                  style={{
                    color: splitColor,
                    fontFamily: fonts.jetbrainsMono,
                    fontSize: 9,
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                  }}
                >
                  {split ? SPLIT_DEFINITIONS[split].eyebrow : 'Session'}
                </Text>
              </View>
              <Text
                style={{
                  color: colors.text,
                  fontFamily: fonts.brand,
                  fontSize: 18,
                  fontWeight: '700',
                }}
              >
                {workout.name}
              </Text>
            </View>
            <Pressable accessibilityLabel="Close" onPress={onClose}>
              <X color={MUTED} size={18} />
            </Pressable>
          </View>

          <View style={{ backgroundColor: CARD_BORDER, height: 1 }} />

          <View style={{ gap: 10 }}>
            <DetailRow label="Date" value={format(started, 'EEEE · MMM d, yyyy')} />
            <DetailRow label="Start" value={format(started, 'h:mm a')} />
            <DetailRow
              label="Complete"
              value={completed ? format(completed, 'h:mm a') : '—'}
            />
            <DetailRow
              label="Duration"
              value={
                workout.duration_seconds != null
                  ? formatElapsedDuration(workout.duration_seconds)
                  : '—'
              }
            />
          </View>

          <Pressable
            onPress={() => {
              onClose();
              router.push(`/history/${workout.id}`);
            }}
            style={{
              alignItems: 'center',
              backgroundColor: colors.accent,
              borderRadius: 10,
              marginTop: 4,
              paddingVertical: 12,
            }}
          >
            <Text
              style={{
                color: colors.bg,
                fontFamily: fonts.brand,
                fontSize: 13,
                fontWeight: '700',
              }}
            >
              View Full Session
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function DetailRow({
  label,
  value,
  valueColor = colors.text,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View className="flex-row items-center justify-between" style={{ gap: 12 }}>
      <Text
        style={{
          color: MUTED,
          fontFamily: fonts.body,
          fontSize: 11,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: valueColor,
          fontFamily: fonts.jetbrainsMono,
          fontSize: 11,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function HistoryChartSvg({
  data,
  selectedId,
  onSelect,
}: {
  data: ReturnType<typeof buildWorkoutHistoryChart>;
  selectedId: string | null;
  onSelect: (point: WorkoutHistoryPoint) => void;
}) {
  const { padding, height } = HISTORY_CHART;
  const hourFractions = historyHourFractions();
  const hourLabels = historyHourLabels();
  const plotBottom = height - padding.bottom;
  const plotTop = padding.top;

  return (
    <Svg height={data.chartHeight} width={data.chartWidth}>
      {hourFractions.map((fraction, index) => {
        const y =
          plotTop + (plotBottom - plotTop) * (1 - fraction);
        return (
          <Line
            key={hourLabels[index]}
            stroke={GRID}
            strokeDasharray="4 6"
            strokeWidth={1}
            x1={padding.left}
            x2={data.chartWidth - padding.right}
            y1={y}
            y2={y}
          />
        );
      })}

      {data.dayLabels.map((day) => {
        const x = padding.left + day.index * HISTORY_CHART.dayWidth + HISTORY_CHART.dayWidth / 2;
        return (
          <Line
            key={day.fullLabel}
            stroke={GRID}
            strokeWidth={1}
            x1={x}
            x2={x}
            y1={plotTop}
            y2={plotBottom}
          />
        );
      })}

      {hourLabels.map((label, index) => {
        const y =
          plotTop + (plotBottom - plotTop) * (1 - hourFractions[index]!);
        return (
          <SvgText
            key={label}
            fill={MUTED}
            fontFamily={fonts.jetbrainsMono}
            fontSize={9}
            textAnchor="end"
            x={padding.left - 8}
            y={y + 3}
          >
            {label}
          </SvgText>
        );
      })}

      {data.dayLabels.map((day) => {
        const x = padding.left + day.index * HISTORY_CHART.dayWidth + HISTORY_CHART.dayWidth / 2;
        return (
          <SvgText
            key={`${day.label}-${day.index}`}
            fill={MUTED}
            fontFamily={fonts.jetbrainsMono}
            fontSize={9}
            textAnchor="middle"
            x={x}
            y={height - 10}
          >
            {day.label}
          </SvgText>
        );
      })}

      {data.points.map((point) => {
        const isSelected = selectedId === point.workout.id;
        return (
          <Circle
            key={point.workout.id}
            cx={point.x}
            cy={point.y}
            fill={point.color}
            onPress={() => onSelect(point)}
            r={isSelected ? HISTORY_CHART.dotRadius + 2 : HISTORY_CHART.dotRadius}
            stroke={isSelected ? colors.text : '#0d0d1b'}
            strokeWidth={isSelected ? 2 : 1.5}
          />
        );
      })}
    </Svg>
  );
}

export function WorkoutHistoryChart({ unit = 'kg' }: { unit?: 'kg' | 'lb' }) {
  const { isCompact } = useLayoutBreakpoint();
  const { data: workouts, isLoading, isError, error, refetch } = useWorkoutHistory();
  const { data: weekSplits } = useThisWeekSplits();
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => new Date());

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const chartData = useMemo(
    () => buildWorkoutHistoryChart(workouts ?? []),
    [workouts],
  );

  const cards = weekSplits?.cards ?? [];
  const { trainingDays, upcomingDaysBySplit } = useMemo(
    () => buildCalendarDayMarkers(month, workouts ?? [], cards),
    [cards, month, workouts],
  );

  const handleCalendarSelect = (date: Date) => {
    setSelectedDate(date);

    const completedOnDay = workoutsOnDate(workouts ?? [], date);
    if (completedOnDay.length === 0) {
      return;
    }

    const latest = [...completedOnDay].sort(
      (a, b) => parseISO(b.started_at).getTime() - parseISO(a.started_at).getTime(),
    )[0]!;
    setSelectedWorkout(latest);
  };

  const handleTimelineSelect = (point: WorkoutHistoryPoint) => {
    setSelectedWorkout(point.workout);
    setSelectedDate(parseISO(point.workout.started_at));
  };

  return (
    <>
      <View
        className={isCompact ? 'flex-col' : 'flex-row'}
        style={{ alignItems: 'stretch', gap: 12 }}
      >
        <View style={{ ...PANEL_STYLE, flex: 1, minHeight: 320, minWidth: 0 }}>
          <View style={{ gap: 4 }}>
            <InsightSectionHeading title="Session Timeline" />
            <Text
              style={{
                color: MUTED,
                fontFamily: fonts.body,
                fontSize: 11,
              }}
            >
              Each dot is a completed workout.
            </Text>
          </View>

          <View className="flex-row flex-wrap" style={{ gap: 12 }}>
            {LEGEND.map((item) => (
              <View key={item.label} className="flex-row items-center" style={{ gap: 6 }}>
                <View
                  style={{
                    backgroundColor: item.color,
                    borderRadius: 999,
                    height: 8,
                    width: 8,
                  }}
                />
                <Text
                  style={{
                    color: MUTED,
                    fontFamily: fonts.jetbrainsMono,
                    fontSize: 10,
                  }}
                >
                  {item.label}
                </Text>
              </View>
            ))}
          </View>

          {isLoading ? (
            <ActivityIndicator color={colors.accent} />
          ) : null}

          {isError ? (
            <QueryError
              message={getSupabaseErrorMessage(error)}
              onRetry={() => void refetch()}
            />
          ) : null}

          {!isLoading && !isError && chartData.points.length === 0 ? (
            <Text style={{ color: MUTED, fontFamily: fonts.body, fontSize: 12 }}>
              Complete a workout to populate your session history chart.
            </Text>
          ) : null}

          {!isLoading && !isError && chartData.points.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <HistoryChartSvg
                data={chartData}
                selectedId={selectedWorkout?.id ?? null}
                onSelect={handleTimelineSelect}
              />
            </ScrollView>
          ) : null}
        </View>

        <View style={{ ...PANEL_STYLE, flex: 1, minHeight: 320, minWidth: 0 }}>
          <View style={{ gap: 4 }}>
            <InsightSectionHeading title="Workout History" />
            <Text
              style={{
                color: MUTED,
                fontFamily: fonts.body,
                fontSize: 11,
              }}
            >
              Past sessions and upcoming training days.
            </Text>
          </View>

          <WorkoutCalendar
            embedded
            month={month}
            onMonthChange={setMonth}
            onSelectDate={handleCalendarSelect}
            persistSelectedDayStyle={false}
            selectedDate={selectedDate}
            trainingDays={trainingDays}
            upcomingDaysBySplit={upcomingDaysBySplit}
          />
        </View>
      </View>

      <SessionDetailModal
        visible={selectedWorkout != null}
        workout={selectedWorkout}
        onClose={() => setSelectedWorkout(null)}
      />
    </>
  );
}
