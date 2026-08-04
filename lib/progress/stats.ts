import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from 'date-fns';

import type { Workout } from '@/lib/supabase';

export interface WeeklyVolumeBucket {
  weekStart: string;
  label: string;
  volume: number;
}

export function bucketWeeklyVolume(
  workouts: Workout[],
  weeks = 12,
): WeeklyVolumeBucket[] {
  const now = new Date();
  const buckets: WeeklyVolumeBucket[] = [];

  for (let i = weeks - 1; i >= 0; i -= 1) {
    const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

    const volume = workouts
      .filter((workout) => {
        if (workout.status !== 'completed') return false;
        const date = parseISO(workout.started_at);
        return date >= weekStart && date <= weekEnd;
      })
      .reduce((sum, workout) => sum + (workout.total_volume ?? 0), 0);

    buckets.push({
      weekStart: weekStart.toISOString(),
      label: format(weekStart, 'MMM d'),
      volume,
    });
  }

  return buckets;
}

export function getTrainingDayKeys(
  workouts: Array<Pick<Workout, 'started_at' | 'status'>>,
): Set<string> {
  const keys = new Set<string>();

  for (const workout of workouts) {
    if (workout.status !== 'completed') continue;
    keys.add(format(parseISO(workout.started_at), 'yyyy-MM-dd'));
  }

  return keys;
}

export function buildMonthCalendarDays(
  month: Date,
  trainingDays: Set<string>,
): Array<{ date: Date; inMonth: boolean; hasWorkout: boolean }> {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  return eachDayOfInterval({ start: gridStart, end: gridEnd }).map((date) => ({
    date,
    inMonth: isSameMonth(date, month),
    hasWorkout: trainingDays.has(format(date, 'yyyy-MM-dd')),
  }));
}

export function workoutsOnDate(
  workouts: Workout[],
  date: Date,
): Workout[] {
  return workouts.filter(
    (workout) =>
      workout.status === 'completed' &&
      isSameDay(parseISO(workout.started_at), date),
  );
}

export function buildHeatmapDays(
  workouts: Workout[],
  days = 91,
): Array<{ date: string; count: number; volume: number }> {
  const end = new Date();
  const start = subDays(end, days - 1);
  const trainingDays = getTrainingDayKeys(workouts);
  const volumeByDay = new Map<string, number>();

  for (const workout of workouts) {
    if (workout.status !== 'completed') continue;
    const key = format(parseISO(workout.started_at), 'yyyy-MM-dd');
    volumeByDay.set(key, (volumeByDay.get(key) ?? 0) + (workout.total_volume ?? 0));
  }

  return eachDayOfInterval({ start, end }).map((date) => {
    const key = format(date, 'yyyy-MM-dd');
    return {
      date: key,
      count: trainingDays.has(key) ? 1 : 0,
      volume: volumeByDay.get(key) ?? 0,
    };
  });
}

export function computeSessionEst1RmMax(
  sets: Array<{ weight: number | null; reps: number | null; is_warmup: boolean }>,
): number {
  let max = 0;

  for (const set of sets) {
    if (set.is_warmup || !set.weight || !set.reps) continue;
    const est = set.weight * (1 + set.reps / 30);
    max = Math.max(max, est);
  }

  return max;
}
