import {
  endOfWeek,
  isWithinInterval,
  parseISO,
  startOfWeek,
  subWeeks,
} from 'date-fns';

import { inferSplitFromWorkoutName, type TrainingSplit } from '@/lib/training/splits';
import type { Workout } from '@/lib/supabase';

export const SPLIT_VOLUME_WEEKS = 8;
export const VOLUME_Y_MIN = 6_000;
export const VOLUME_Y_MAX = 14_000;

export interface SplitVolumeTrendData {
  labels: string[];
  upperA: number[];
  upperB: number[];
  legs: number[];
}

export function bucketSplitVolumeTrend(
  workouts: Array<
    Pick<Workout, 'name' | 'status' | 'started_at' | 'total_volume'>
  >,
  weeks = SPLIT_VOLUME_WEEKS,
  referenceDate = new Date(),
): SplitVolumeTrendData {
  const labels: string[] = [];
  const upperA: number[] = [];
  const upperB: number[] = [];
  const legs: number[] = [];

  const completed = workouts.filter((workout) => workout.status === 'completed');

  for (let index = 0; index < weeks; index += 1) {
    const weeksAgo = weeks - 1 - index;
    const weekStart = startOfWeek(subWeeks(referenceDate, weeksAgo), {
      weekStartsOn: 1,
    });
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

    labels.push(`W${index + 1}`);

    const volumes: Record<TrainingSplit, number> = { A: 0, B: 0, L: 0 };

    for (const workout of completed) {
      const startedAt = parseISO(workout.started_at);
      if (!isWithinInterval(startedAt, { start: weekStart, end: weekEnd })) {
        continue;
      }

      const split = inferSplitFromWorkoutName(workout.name);
      if (!split) continue;

      volumes[split] += workout.total_volume ?? 0;
    }

    upperA.push(Math.round(volumes.A));
    upperB.push(Math.round(volumes.B));
    legs.push(Math.round(volumes.L));
  }

  return { labels, upperA, upperB, legs };
}

export function splitVolumeTrendQueryStart(
  referenceDate = new Date(),
  weeks = SPLIT_VOLUME_WEEKS,
): string {
  return startOfWeek(subWeeks(referenceDate, weeks - 1), {
    weekStartsOn: 1,
  }).toISOString();
}
