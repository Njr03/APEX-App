import { parseISO, startOfWeek } from 'date-fns';

import type { WorkoutHistoryRow } from '@/hooks/queries/useProgressStats';
import { resolveWorkoutSplit, type TrainingSplit } from '@/lib/training/splits';

export const WEEKLY_COMPLETION_BLOCKED_MESSAGE =
  'This workout was already completed this week. It will be available again next week.';

export function getWeekStart(date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function getRoutineCompletedThisWeek(
  routineId: string,
  workouts: WorkoutHistoryRow[],
  now = new Date(),
): WorkoutHistoryRow | null {
  const weekStart = getWeekStart(now);

  return (
    workouts.find(
      (workout) =>
        workout.routine_id === routineId &&
        workout.completed_at &&
        parseISO(workout.completed_at) >= weekStart,
    ) ?? null
  );
}

export function isRoutineCompletedThisWeek(
  routineId: string,
  workouts: WorkoutHistoryRow[],
  now = new Date(),
): boolean {
  return getRoutineCompletedThisWeek(routineId, workouts, now) != null;
}

export function isSplitCompletedThisWeek(
  split: TrainingSplit,
  workouts: WorkoutHistoryRow[],
  now = new Date(),
): boolean {
  const weekStart = getWeekStart(now);

  return workouts.some((workout) => {
    if (!workout.completed_at) return false;
    if (parseISO(workout.completed_at) < weekStart) return false;

    return resolveWorkoutSplit({ name: workout.name }) === split;
  });
}
