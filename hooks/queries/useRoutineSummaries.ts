import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/hooks/queries/queryKeys';
import { formatTargetMusclesSubtitle } from '@/lib/training/targetMuscles';
import { throwIfSupabaseError } from '@/lib/supabase/errors';
import { supabase, type Routine } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export interface RoutineSummary extends Routine {
  exercise_count: number;
  last_used_at: string | null;
  target_muscles: string;
}

export function routineSummariesQueryKey(userId: string) {
  return [...queryKeys.routines.list(userId), 'summary'] as const;
}

export function useRoutineSummaries() {
  const { user } = useAuth();

  return useQuery({
    queryKey: routineSummariesQueryKey(user?.id ?? 'anonymous'),
    enabled: Boolean(user),
    staleTime: 0,
    refetchOnMount: 'always',
    queryFn: async (): Promise<RoutineSummary[]> => {
      const result = await supabase
        .from('routines')
        .select(
          `
          *,
          routine_exercises (
            exercise:exercises ( muscle_group )
          ),
          workouts (started_at)
        `,
        )
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      const rows = throwIfSupabaseError(result);

      return rows.map((row) => {
        const exercises = row.routine_exercises ?? [];
        const muscleGroups = exercises.map(
          (entry) => entry.exercise?.muscle_group,
        );
        const workouts = (row.workouts ?? []) as Array<{ started_at: string }>;
        const lastUsed = workouts.reduce<string | null>((latest, workout) => {
          if (!latest) return workout.started_at;
          return new Date(workout.started_at) > new Date(latest)
            ? workout.started_at
            : latest;
        }, null);

        const { routine_exercises: _re, workouts: _w, ...routine } = row;

        return {
          ...routine,
          exercise_count: exercises.length,
          last_used_at: lastUsed,
          target_muscles: formatTargetMusclesSubtitle(
            muscleGroups,
            exercises.length > 0 ? `${exercises.length} exercises` : 'No exercises yet',
          ),
        };
      });
    },
  });
}
