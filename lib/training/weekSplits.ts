import { format, parseISO } from 'date-fns';

import type { TrainingSplit } from '@/lib/training/splits';
import { kgToDisplay, volumeLabel } from '@/lib/units';

export function formatSplitVolume(
  volumeKg: number | null | undefined,
  unit: 'kg' | 'lb',
): string {
  if (volumeKg == null) return '—';

  const raw = unit === 'lb' ? volumeKg * 2.20462 : volumeKg;
  const rounded = Math.round(raw);
  return `${rounded.toLocaleString('en-US')} ${volumeLabel(unit)}`;
}

export function formatSplitDuration(durationSeconds: number | null | undefined): string {
  if (durationSeconds == null || durationSeconds <= 0) return '—';
  return `${Math.round(durationSeconds / 60)} min`;
}

export function formatSplitDay(startedAt: string): string {
  return format(parseISO(startedAt), 'EEEE');
}

export function formatPrCount(count: number): string {
  return count === 1 ? '🏆 1 PR' : `🏆 ${count} PRs`;
}

export interface SplitSessionSnapshot {
  workoutId: string;
  startedAt: string;
  totalVolume: number;
  durationSeconds: number | null;
  prCount: number;
  exerciseCount: number;
}

export function countWorkoutPrs(workout: {
  workout_exercises?: Array<{ sets?: Array<{ is_pr?: boolean | null }> | null }> | null;
}): number {
  return (workout.workout_exercises ?? []).reduce((total, exercise) => {
    const prSets = (exercise.sets ?? []).filter((set) => set.is_pr).length;
    return total + prSets;
  }, 0);
}

export function countWorkoutExercises(workout: {
  workout_exercises?: Array<unknown> | null;
}): number {
  return workout.workout_exercises?.length ?? 0;
}

export function splitRoute(split: TrainingSplit): `/splits/${TrainingSplit}` {
  return `/splits/${split}`;
}
