import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/hooks/queries/queryKeys';
import {
  ALL_TIME_PR_SELECT,
  mapAllTimePRRow,
  type AllTimePRRawRow,
  type AllTimePRRow,
} from '@/lib/progress/allTimePRs';
import {
  computeHistoryDelta,
  KEY_LIFTS,
  type KeyLiftProgressionRow,
} from '@/lib/progress/keyLifts';
import {
  bucketSplitVolumeTrend,
  splitVolumeTrendQueryStart,
  type SplitVolumeTrendData,
} from '@/lib/progress/splitVolumeTrend';
import { getTrainingDayKeys } from '@/lib/progress/stats';
import {
  computeStreakRuns,
  type StreakRun,
} from '@/lib/progress/streakHistory';
import { computeBestEstimatedOneRm } from '@/lib/oneRepMax';
import { throwIfSupabaseError } from '@/lib/supabase/errors';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export interface EstimatedOneRmTile {
  label: string;
  shortLabel: string;
  color: string;
  value: number;
}

export interface ProgressPageData {
  splitVolumeTrend: SplitVolumeTrendData;
  keyLifts: KeyLiftProgressionRow[];
  estimatedOneRm: EstimatedOneRmTile[];
  allTimePrs: AllTimePRRow[];
  streakRuns: StreakRun[];
  longestStreak: number;
}

async function fetchMaxWeightHistory(
  userId: string,
  exerciseId: string,
): Promise<number[]> {
  const result = await supabase
    .from('workouts')
    .select(
      `
      started_at,
      workout_exercises!inner (
        exercise_id,
        sets ( weight, is_warmup, completed_at )
      )
    `,
    )
    .eq('user_id', userId)
    .eq('status', 'completed')
    .eq('workout_exercises.exercise_id', exerciseId)
    .order('started_at', { ascending: false })
    .limit(8);

  const rows = throwIfSupabaseError(result) as Array<{
    workout_exercises: Array<{
      sets: Array<{
        weight: number | null;
        is_warmup: boolean;
        completed_at: string | null;
      }> | null;
    }>;
  }>;

  const sessionMaxes = rows
    .map((row) => {
      const sets = row.workout_exercises[0]?.sets ?? [];
      const completedSets = sets.filter(
        (set) => set.completed_at && !set.is_warmup,
      );
      if (completedSets.length === 0) return 0;
      return Math.max(...completedSets.map((set) => set.weight ?? 0));
    })
    .filter((value) => value > 0);

  return sessionMaxes.reverse();
}

async function fetchBestOneRmSet(
  userId: string,
  exerciseId: string,
): Promise<number> {
  const result = await supabase
    .from('sets')
    .select(
      `
      weight,
      reps,
      is_warmup,
      workout_exercise:workout_exercises!inner (
        exercise_id,
        workout:workouts!inner ( user_id, status )
      )
    `,
    )
    .eq('workout_exercise.exercise_id', exerciseId)
    .eq('workout_exercise.workout.user_id', userId)
    .eq('workout_exercise.workout.status', 'completed')
    .eq('is_warmup', false)
    .gte('reps', 1)
    .lte('reps', 10)
    .order('weight', { ascending: false })
    .limit(20);

  const sets = throwIfSupabaseError(result) as Array<{
    weight: number | null;
    reps: number | null;
    is_warmup: boolean;
  }>;

  return computeBestEstimatedOneRm(sets);
}

export function useProgressPageData() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...queryKeys.workouts.lists(), 'progress-page', user?.id] as const,
    enabled: Boolean(user),
    queryFn: async (): Promise<ProgressPageData> => {
      const since = splitVolumeTrendQueryStart();

      const [workoutsResult, exercisesResult, prsResult, profileResult, allWorkoutsResult] =
        await Promise.all([
          supabase
            .from('workouts')
            .select('id, name, status, started_at, total_volume')
            .eq('user_id', user!.id)
            .eq('status', 'completed')
            .gte('started_at', since)
            .order('started_at', { ascending: false }),
          supabase.from('exercises').select('id, name'),
          supabase
            .from('personal_records')
            .select(ALL_TIME_PR_SELECT)
            .eq('user_id', user!.id)
            .order('achieved_at', { ascending: false }),
          supabase
            .from('profiles')
            .select('longest_streak')
            .eq('id', user!.id)
            .single(),
          supabase
            .from('workouts')
            .select('started_at, status')
            .eq('user_id', user!.id)
            .eq('status', 'completed')
            .order('started_at', { ascending: true }),
        ]);

      const workouts = throwIfSupabaseError(workoutsResult);
      const exercises = throwIfSupabaseError(exercisesResult);
      const prRows = throwIfSupabaseError(prsResult) as AllTimePRRawRow[];
      const profile = throwIfSupabaseError(profileResult);
      const allWorkouts = throwIfSupabaseError(allWorkoutsResult);

      const exerciseByName = new Map(exercises.map((row) => [row.name, row.id]));
      const splitVolumeTrend = bucketSplitVolumeTrend(workouts);

      const keyLiftRows = await Promise.all(
        KEY_LIFTS.map(async (definition) => {
          const exerciseId = exerciseByName.get(definition.exerciseName);
          if (!exerciseId) {
            return {
              definition,
              exerciseId: '',
              history: [],
              currentMax: 0,
              deltaKg: 0,
            } satisfies KeyLiftProgressionRow;
          }

          const history = await fetchMaxWeightHistory(user!.id, exerciseId);
          return {
            definition,
            exerciseId,
            history,
            currentMax: history[history.length - 1] ?? 0,
            deltaKg: computeHistoryDelta(history),
          } satisfies KeyLiftProgressionRow;
        }),
      );

      const estimatedOneRm = await Promise.all(
        KEY_LIFTS.map(async (definition) => {
          const exerciseId = exerciseByName.get(definition.exerciseName);
          const value = exerciseId
            ? await fetchBestOneRmSet(user!.id, exerciseId)
            : 0;

          return {
            label: definition.label,
            shortLabel: definition.shortLabel,
            color: definition.color,
            value,
          } satisfies EstimatedOneRmTile;
        }),
      );

      const trainingDays = getTrainingDayKeys(allWorkouts);
      const streakRuns = computeStreakRuns([...trainingDays]);
      const computedLongest = streakRuns.reduce(
        (max, run) => Math.max(max, run.length),
        0,
      );

      return {
        splitVolumeTrend,
        keyLifts: keyLiftRows,
        estimatedOneRm,
        allTimePrs: prRows.map((row) => mapAllTimePRRow(row)),
        streakRuns,
        longestStreak: Math.max(profile.longest_streak ?? 0, computedLongest),
      };
    },
  });
}
