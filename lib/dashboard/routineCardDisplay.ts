import { parseISO, startOfWeek } from 'date-fns';

import type { RoutineSummary } from '@/hooks/queries/useRoutineSummaries';
import { resolveWorkoutCardColor } from '@/lib/dashboard/workoutCardColors';
import type { SplitSessionSnapshot } from '@/lib/training/weekSplits';
import type { TrainingSplit } from '@/lib/training/splits';
import type { Workout } from '@/lib/supabase';

export type DashboardWorkoutCardStatus =
  | 'completed'
  | 'today'
  | 'upcoming'
  | 'template';

export interface DashboardWorkoutCardModel {
  eyebrow: string;
  title: string;
  subtitle: string;
  color: string;
  status: DashboardWorkoutCardStatus;
  splitId?: TrainingSplit;
  completedSession: SplitSessionSnapshot | null;
  lastSession: SplitSessionSnapshot | null;
  exerciseCount?: number;
  lastUsedLabel?: string;
}

function workoutToSnapshot(workout: Workout): SplitSessionSnapshot {
  return {
    workoutId: workout.id,
    startedAt: workout.started_at,
    totalVolume: workout.total_volume ?? 0,
    durationSeconds: workout.duration_seconds,
    prCount: 0,
    exerciseCount: 0,
  };
}

function findRoutineWorkouts(routine: RoutineSummary, workouts: Workout[]): Workout[] {
  return workouts
    .filter((workout) => workout.routine_id === routine.id)
    .sort(
      (a, b) =>
        parseISO(b.started_at).getTime() - parseISO(a.started_at).getTime(),
    );
}

export function buildRoutineCardModel(
  routine: RoutineSummary,
  workouts: Workout[],
): DashboardWorkoutCardModel {
  const routineWorkouts = findRoutineWorkouts(routine, workouts);
  const lastWorkout = routineWorkouts[0] ?? null;
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const completedThisWeek =
    routineWorkouts.find(
      (workout) => parseISO(workout.started_at) >= weekStart,
    ) ?? null;

  const lastUsedLabel = routine.last_used_at
    ? parseISO(routine.last_used_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : 'Never';

  const color = resolveWorkoutCardColor({
    name: routine.name,
    muscleGroups: routine.muscle_groups,
    preferMuscleGroups: true,
  });

  if (completedThisWeek) {
    return {
      eyebrow: 'SAVED',
      title: routine.name,
      subtitle: routine.target_muscles,
      color,
      status: 'completed',
      completedSession: workoutToSnapshot(completedThisWeek),
      lastSession: lastWorkout ? workoutToSnapshot(lastWorkout) : null,
      exerciseCount: routine.exercise_count,
      lastUsedLabel,
    };
  }

  return {
    eyebrow: 'SAVED',
    title: routine.name,
    subtitle: routine.target_muscles,
    color,
    status: 'template',
    completedSession: null,
    lastSession: lastWorkout ? workoutToSnapshot(lastWorkout) : null,
    exerciseCount: routine.exercise_count,
    lastUsedLabel,
  };
}
