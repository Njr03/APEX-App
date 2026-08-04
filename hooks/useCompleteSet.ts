import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/hooks/queries/queryKeys';
import { useUpdateSet, useUpsertPersonalRecord } from '@/hooks/queries';
import { checkForPersonalRecords } from '@/lib/personalRecords';
import type { PersonalRecord, Set } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

interface CompleteSetInput {
  set: Set;
  exerciseId: string;
  exerciseName: string;
  weightKg: number;
  reps: number;
  rpe?: number | null;
  isWarmup: boolean;
  unit?: 'kg' | 'lb';
}

export function useCompleteSet() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const updateSet = useUpdateSet();
  const upsertPR = useUpsertPersonalRecord();

  return useMutation({
    mutationFn: async ({
      set,
      exerciseId,
      exerciseName,
      weightKg,
      reps,
      rpe,
      isWarmup,
      unit = 'kg',
    }: CompleteSetInput) => {
      if (!user) throw new Error('Not authenticated');

      const existingResult = await queryClient.fetchQuery({
        queryKey: queryKeys.personalRecords.byExercise(exerciseId),
        queryFn: async () => {
          const { supabase } = await import('@/lib/supabase');
          const { throwIfSupabaseError } = await import(
            '@/lib/supabase/errors'
          );
          const result = await supabase
            .from('personal_records')
            .select('*')
            .eq('user_id', user.id)
            .eq('exercise_id', exerciseId);
          return throwIfSupabaseError(result) as PersonalRecord[];
        },
      });

      const prCheck = checkForPersonalRecords(
        weightKg,
        reps,
        existingResult,
        isWarmup,
      );

      const updatedSet = await updateSet.mutateAsync({
        id: set.id,
        workoutExerciseId: set.workout_exercise_id,
        weight: weightKg,
        reps,
        rpe: rpe ?? null,
        is_warmup: isWarmup,
        is_pr: prCheck.isPR,
        completed_at: new Date().toISOString(),
      });

      for (const broken of prCheck.brokenRecords) {
        await upsertPR.mutateAsync({
          exercise_id: exerciseId,
          record_type: broken.record_type,
          value: broken.value,
          set_id: set.id,
          achieved_at: new Date().toISOString(),
        });
      }

      return {
        set: updatedSet,
        prCheck,
      };
    },
  });
}

export function useUncompleteSet() {
  const updateSet = useUpdateSet();

  return useMutation({
    mutationFn: async (set: Set) =>
      updateSet.mutateAsync({
        id: set.id,
        workoutExerciseId: set.workout_exercise_id,
        completed_at: null,
        is_pr: false,
      }),
  });
}
