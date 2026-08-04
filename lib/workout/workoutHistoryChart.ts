import { format, getHours, getMinutes, parseISO } from 'date-fns';

import {
  inferSplitFromWorkoutName,
  SPLIT_DEFINITIONS,
  type TrainingSplit,
} from '@/lib/training/splits';
import type { Workout } from '@/lib/supabase';
import { colors } from '@/constants/theme';

export const HISTORY_CHART = {
  dayWidth: 52,
  height: 220,
  padding: { left: 44, right: 16, top: 14, bottom: 36 },
  hourMin: 5,
  hourMax: 22,
  dotRadius: 6,
} as const;

export interface WorkoutHistoryPoint {
  workout: Workout;
  split: TrainingSplit | null;
  color: string;
  dayIndex: number;
  slotIndex: number;
  slotCount: number;
  x: number;
  y: number;
  timeLabel: string;
  dateLabel: string;
}

export interface WorkoutHistoryChartData {
  points: WorkoutHistoryPoint[];
  dayLabels: Array<{ index: number; label: string; fullLabel: string }>;
  chartWidth: number;
  chartHeight: number;
}

function resolveSplitColor(name: string): { split: TrainingSplit | null; color: string } {
  const split = inferSplitFromWorkoutName(name);
  if (split) {
    return { split, color: SPLIT_DEFINITIONS[split].color };
  }

  return { split: null, color: colors.accent };
}

function hourToFraction(hour: number, minute: number): number {
  const totalMinutes = hour * 60 + minute;
  const minMinutes = HISTORY_CHART.hourMin * 60;
  const maxMinutes = HISTORY_CHART.hourMax * 60;
  const clamped = Math.min(maxMinutes, Math.max(minMinutes, totalMinutes));
  return (clamped - minMinutes) / (maxMinutes - minMinutes);
}

function chartY(fraction: number): number {
  const { height, padding } = HISTORY_CHART;
  const plotHeight = height - padding.top - padding.bottom;
  return padding.top + plotHeight * (1 - fraction);
}

function chartX(dayIndex: number, slotIndex: number, slotCount: number): number {
  const { dayWidth, padding } = HISTORY_CHART;
  const dayCenter = padding.left + dayIndex * dayWidth + dayWidth / 2;

  if (slotCount <= 1) return dayCenter;

  const spread = Math.min(dayWidth - HISTORY_CHART.dotRadius * 4, 28);
  const step = spread / (slotCount - 1);
  return dayCenter - spread / 2 + slotIndex * step;
}

export function buildWorkoutHistoryChart(workouts: Workout[]): WorkoutHistoryChartData {
  const sorted = [...workouts].sort(
    (a, b) => parseISO(a.started_at).getTime() - parseISO(b.started_at).getTime(),
  );

  const dayKeys: string[] = [];
  const dayIndexByKey = new Map<string, number>();
  const slotsByDay = new Map<string, Workout[]>();

  for (const workout of sorted) {
    const date = parseISO(workout.started_at);
    const key = format(date, 'yyyy-MM-dd');

    if (!dayIndexByKey.has(key)) {
      dayIndexByKey.set(key, dayKeys.length);
      dayKeys.push(key);
    }

    const bucket = slotsByDay.get(key) ?? [];
    bucket.push(workout);
    slotsByDay.set(key, bucket);
  }

  for (const [key, bucket] of slotsByDay) {
    bucket.sort(
      (a, b) => parseISO(a.started_at).getTime() - parseISO(b.started_at).getTime(),
    );
    slotsByDay.set(key, bucket);
  }

  const points: WorkoutHistoryPoint[] = [];

  for (const [key, bucket] of slotsByDay) {
    const dayIndex = dayIndexByKey.get(key)!;

    bucket.forEach((workout, slotIndex) => {
      const started = parseISO(workout.started_at);
      const { split, color } = resolveSplitColor(workout.name);
      const fraction = hourToFraction(getHours(started), getMinutes(started));

      points.push({
        workout,
        split,
        color,
        dayIndex,
        slotIndex,
        slotCount: bucket.length,
        x: chartX(dayIndex, slotIndex, bucket.length),
        y: chartY(fraction),
        timeLabel: format(started, 'h:mm a'),
        dateLabel: format(started, 'EEE · MMM d'),
      });
    });
  }

  const dayLabels = dayKeys.map((key, index) => {
    const date = parseISO(`${key}T12:00:00`);
    return {
      index,
      label: format(date, 'MMM d'),
      fullLabel: format(date, 'EEE · MMM d'),
    };
  });

  const chartWidth = Math.max(
    320,
    HISTORY_CHART.padding.left +
      HISTORY_CHART.padding.right +
      Math.max(dayKeys.length, 1) * HISTORY_CHART.dayWidth,
  );

  return {
    points,
    dayLabels,
    chartWidth,
    chartHeight: HISTORY_CHART.height,
  };
}

export function historyHourLabels(): string[] {
  return ['6a', '9a', '12p', '3p', '6p', '9p'];
}

export function historyHourFractions(): number[] {
  return [6, 9, 12, 15, 18, 21].map((hour) =>
    hourToFraction(hour, 0),
  );
}
