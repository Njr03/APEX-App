import { useQuery } from '@tanstack/react-query';
import { startOfWeek, subWeeks } from 'date-fns';

import { queryKeys } from '@/hooks/queries/queryKeys';
import {
  countWorkoutExercises,
  countWorkoutPrs,
  type SplitSessionSnapshot,
} from '@/lib/training/weekSplits';
import {
  inferSplitFromWorkoutName,
  resolveSplitStatuses,
  SPLIT_DEFINITIONS,
  WEEKLY_SPLIT_ORDER,
  type SplitCardStatus,
  type SplitDefinition,
  type TrainingSplit,
} from '@/lib/training/splits';
import { targetMusclesFromWorkoutExercises } from '@/lib/training/targetMuscles';
import { throwIfSupabaseError } from '@/lib/supabase/errors';
import { supabase, type WorkoutWithDetails } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export interface WeekSplitCardData {
  definition: SplitDefinition;
  status: SplitCardStatus;
  completedWorkoutId: string | null;
  completedSession: SplitSessionSnapshot | null;
  lastSession: SplitSessionSnapshot | null;
  targetMuscles: string;
}

export interface ThisWeekSplitsData {
  cards: WeekSplitCardData[];
}

const WORKOUT_SELECT = `
  *,
  workout_exercises (
    id,
    exercise:exercises ( muscle_group ),
    sets (*)
  )
`;

function toSnapshot(workout: WorkoutWithDetails): SplitSessionSnapshot {
  return {
    workoutId: workout.id,
    startedAt: workout.started_at,
    totalVolume: workout.total_volume ?? 0,
    durationSeconds: workout.duration_seconds,
    prCount: countWorkoutPrs(workout),
    exerciseCount: countWorkoutExercises(workout),
  };
}

function buildCards(workouts: WorkoutWithDetails[]): ThisWeekSplitsData {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const completedSplits = new Set<TrainingSplit>();
  const completedBySplit = new Map<TrainingSplit, WorkoutWithDetails>();
  const lastBySplit = new Map<TrainingSplit, WorkoutWithDetails>();

  for (const workout of workouts) {
    const split = inferSplitFromWorkoutName(workout.name);
    if (!split) continue;

    const startedAt = new Date(workout.started_at);
    if (startedAt >= weekStart) {
      completedBySplit.set(split, workout);
      completedSplits.add(split);
      continue;
    }

    if (!lastBySplit.has(split)) {
      lastBySplit.set(split, workout);
    }
  }

  const statuses = resolveSplitStatuses(completedSplits);

  const cards = WEEKLY_SPLIT_ORDER.map((split) => {
    const completedWorkout = completedBySplit.get(split);
    const lastWorkout = lastBySplit.get(split);
    const sourceWorkout = completedWorkout ?? lastWorkout;

    return {
      definition: SPLIT_DEFINITIONS[split],
      status: statuses[split],
      completedWorkoutId: completedWorkout?.id ?? null,
      completedSession: completedWorkout ? toSnapshot(completedWorkout) : null,
      lastSession: lastWorkout ? toSnapshot(lastWorkout) : null,
      targetMuscles: sourceWorkout
        ? targetMusclesFromWorkoutExercises(
            sourceWorkout.workout_exercises,
            SPLIT_DEFINITIONS[split].muscles,
          )
        : '',
    };
  });

  return { cards };
}

export function useThisWeekSplits() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...queryKeys.workouts.lists(), 'this-week-splits', user?.id] as const,
    enabled: Boolean(user),
    queryFn: async (): Promise<ThisWeekSplitsData> => {
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const historyStart = subWeeks(weekStart, 8).toISOString();

      const result = await supabase
        .from('workouts')
        .select(WORKOUT_SELECT)
        .eq('user_id', user!.id)
        .eq('status', 'completed')
        .gte('started_at', historyStart)
        .order('started_at', { ascending: false });

      const workouts = throwIfSupabaseError(result) as WorkoutWithDetails[];
      return buildCards(workouts);
    },
  });
}
