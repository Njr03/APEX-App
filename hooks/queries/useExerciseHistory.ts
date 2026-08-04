import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/hooks/queries/queryKeys';
import { throwIfSupabaseError } from '@/lib/supabase/errors';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export interface ExerciseHistorySet {
  id: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  is_warmup: boolean;
  is_pr: boolean;
  completed_at: string | null;
  workout_id: string;
  workout_name: string;
  workout_date: string;
}

export interface ExerciseSessionSummary {
  workout_id: string;
  workout_name: string;
  workout_date: string;
  sets: ExerciseHistorySet[];
  max_weight: number;
}

export function useExerciseHistory(exerciseId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...queryKeys.exercises.detail(exerciseId ?? ''), 'history'] as const,
    enabled: Boolean(user && exerciseId),
    queryFn: async (): Promise<{
      sets: ExerciseHistorySet[];
      sessions: ExerciseSessionSummary[];
      progression: Array<{ date: string; maxWeight: number }>;
    }> => {
      const workoutExercisesResult = await supabase
        .from('workout_exercises')
        .select(
          `
          id,
          workout:workouts!inner (
            id,
            name,
            started_at,
            user_id,
            status
          )
        `,
        )
        .eq('exercise_id', exerciseId!)
        .eq('workout.user_id', user!.id)
        .eq('workout.status', 'completed');

      const workoutExercises = throwIfSupabaseError(workoutExercisesResult);

      if (workoutExercises.length === 0) {
        return { sets: [], sessions: [], progression: [] };
      }

      const workoutExerciseIds = workoutExercises.map((row) => row.id);
      const workoutMeta = new Map(
        workoutExercises.map((row) => {
          const workout = row.workout as {
            id: string;
            name: string;
            started_at: string;
          };
          return [row.id, workout];
        }),
      );

      const setsResult = await supabase
        .from('sets')
        .select('*')
        .in('workout_exercise_id', workoutExerciseIds)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false });

      const setRows = throwIfSupabaseError(setsResult);

      const sets: ExerciseHistorySet[] = setRows.map((row) => {
        const workout = workoutMeta.get(row.workout_exercise_id)!;
        return {
          id: row.id,
          set_number: row.set_number,
          weight: row.weight,
          reps: row.reps,
          is_warmup: row.is_warmup,
          is_pr: row.is_pr,
          completed_at: row.completed_at,
          workout_id: workout.id,
          workout_name: workout.name,
          workout_date: workout.started_at,
        };
      });

      const sessionMap = new Map<string, ExerciseSessionSummary>();

      for (const set of sets) {
        if (set.is_warmup) continue;

        const existing = sessionMap.get(set.workout_id);
        const weight = set.weight ?? 0;

        if (!existing) {
          sessionMap.set(set.workout_id, {
            workout_id: set.workout_id,
            workout_name: set.workout_name,
            workout_date: set.workout_date,
            sets: [set],
            max_weight: weight,
          });
        } else {
          existing.sets.push(set);
          existing.max_weight = Math.max(existing.max_weight, weight);
        }
      }

      const sessions = [...sessionMap.values()].sort(
        (a, b) =>
          new Date(b.workout_date).getTime() -
          new Date(a.workout_date).getTime(),
      );

      const progression = [...sessions]
        .sort(
          (a, b) =>
            new Date(a.workout_date).getTime() -
            new Date(b.workout_date).getTime(),
        )
        .slice(-12)
        .map((session) => ({
          date: session.workout_date,
          maxWeight: session.max_weight,
        }));

      return { sets, sessions, progression };
    },
  });
}
