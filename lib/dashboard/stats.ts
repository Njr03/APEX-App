import {
  eachDayOfInterval,
  endOfWeek,
  format,
  parseISO,
  startOfWeek,
  subDays,
  subWeeks,
} from 'date-fns';

import type { Workout } from '@/lib/supabase';
import { toCalendarDayKey } from '@/lib/streak';

export interface VolumeComparison {
  thisWeek: number;
  lastWeek: number;
  delta: number;
  deltaPercent: number | null;
}

export interface DailyVolumePoint {
  date: string;
  label: string;
  volume: number;
}

export function getVolumeComparison(
  workouts: Workout[],
  referenceDate = new Date(),
): VolumeComparison {
  const thisWeekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
  const thisWeekEnd = endOfWeek(referenceDate, { weekStartsOn: 1 });
  const lastWeekStart = startOfWeek(subWeeks(referenceDate, 1), {
    weekStartsOn: 1,
  });
  const lastWeekEnd = endOfWeek(lastWeekStart, { weekStartsOn: 1 });

  const sumRange = (start: Date, end: Date) =>
    workouts
      .filter((workout) => {
        if (workout.status !== 'completed') return false;
        const date = parseISO(workout.started_at);
        return date >= start && date <= end;
      })
      .reduce((total, workout) => total + (workout.total_volume ?? 0), 0);

  const thisWeek = sumRange(thisWeekStart, thisWeekEnd);
  const lastWeek = sumRange(lastWeekStart, lastWeekEnd);
  const delta = thisWeek - lastWeek;
  const deltaPercent =
    lastWeek > 0 ? Math.round((delta / lastWeek) * 100) : null;

  return { thisWeek, lastWeek, delta, deltaPercent };
}

/** Last N calendar days including rest days as zero volume. */
export function getDailyVolumeSeries(
  workouts: Workout[],
  days = 7,
  referenceDate = new Date(),
): DailyVolumePoint[] {
  const start = subDays(referenceDate, days - 1);
  const volumeByDay = new Map<string, number>();

  for (const workout of workouts) {
    if (workout.status !== 'completed') continue;
    const key = toCalendarDayKey(workout.started_at);
    volumeByDay.set(
      key,
      (volumeByDay.get(key) ?? 0) + (workout.total_volume ?? 0),
    );
  }

  return eachDayOfInterval({ start, end: referenceDate }).map((date) => {
    const key = toCalendarDayKey(date);
    return {
      date: key,
      label: format(date, 'EEE'),
      volume: volumeByDay.get(key) ?? 0,
    };
  });
}
