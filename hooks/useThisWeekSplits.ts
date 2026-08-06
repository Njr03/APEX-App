import { useQuery } from '@tanstack/react-query';
import { startOfWeek, subWeeks } from 'date-fns';

import { queryKeys } from '@/hooks/queries/queryKeys';
import {
  countWorkoutExercises,
  countWorkoutPrs,
  type SplitSessionSnapshot,
} from '@/lib/training/weekSplits';
import {
  resolveSplitStatuses,
  resolveWorkoutSplit,
  SPLIT_DEFINITIONS,
  WEEKLY_SPLIT_ORDER,
  type SplitCardStatus,
  type SplitDefinition,
  type TrainingSplit,
} from '@/lib/training/splits';
import { targetMusclesFromWorkoutExercises } from '@/lib/training/targetMuscles';
import { throwIfSupabaseError } from '@/lib/supabase/errors';
import { supabase } from '@/lib/supabase';
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

type SplitWorkoutRow = {
  id: string;
  name: string;
  started_at: string;
  completed_at: string | null;
  total_volume: number | null;
  duration_seconds: number | null;
  routines?: { name: string } | null;
  workout_exercises: Array<{
    id: string;
    exercise: { muscle_group: string };
    sets: Array<{
      completed_at: string | null;
      is_warmup: boolean;
      is_pr: boolean;
      weight: number | null;
      reps: number | null;
    }>;
  }>;
};

const WORKOUT_SELECT = `
  *,
  routines ( name ),
  workout_exercises (
    id,
    exercise:exercises ( muscle_group ),
    sets (*)
  )
`;

function resolveSplitForWorkout(workout: SplitWorkoutRow): TrainingSplit | null {
  return resolveWorkoutSplit({
    name: workout.name,
    routineName: workout.routines?.name ?? null,
    muscleGroups: workout.workout_exercises?.map(
      (entry) => entry.exercise?.muscle_group,
    ),
  });
}

function workoutSessionDate(workout: SplitWorkoutRow): Date {
  return new Date(workout.completed_at ?? workout.started_at);
}

function toSnapshot(workout: SplitWorkoutRow): SplitSessionSnapshot {
  return {
    workoutId: workout.id,
    startedAt: workout.started_at,
    totalVolume: workout.total_volume ?? 0,
    durationSeconds: workout.duration_seconds,
    prCount: countWorkoutPrs({ workout_exercises: workout.workout_exercises }),
    exerciseCount: countWorkoutExercises({
      workout_exercises: workout.workout_exercises,
    }),
  };
}

function buildCards(workouts: SplitWorkoutRow[]): ThisWeekSplitsData {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const completedSplits = new Set<TrainingSplit>();
  const completedBySplit = new Map<TrainingSplit, SplitWorkoutRow>();
  const lastBySplit = new Map<TrainingSplit, SplitWorkoutRow>();

  for (const workout of workouts) {
    const split = resolveSplitForWorkout(workout);
    if (!split) continue;

    const sessionDate = workoutSessionDate(workout);
    if (sessionDate >= weekStart) {
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
    staleTime: 0,
    refetchOnMount: 'always',
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

      const workouts = throwIfSupabaseError(result) as unknown as SplitWorkoutRow[];
      return buildCards(workouts);
    },
  });
}
