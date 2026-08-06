import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/hooks/queries/queryKeys';
import {
  appendSetToActiveWorkoutCache,
  invalidateWorkoutQueriesExceptActive,
  removeSetFromActiveWorkoutCache,
  updateSetInActiveWorkoutCache,
} from '@/hooks/queries/workoutCache';
import { useAuth } from '@/providers/AuthProvider';
import { assertSupabaseOk, throwIfSupabaseError } from '@/lib/supabase/errors';
import {
  supabase,
  type Set,
  type TablesInsert,
  type TablesUpdate,
} from '@/lib/supabase';
import {
  createSetSchema,
  updateSetSchema,
  type CreateSetInput,
  type UpdateSetInput,
} from '@/lib/validations/training';

export function useSetsByWorkoutExercise(workoutExerciseId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.sets.byWorkoutExercise(workoutExerciseId ?? ''),
    enabled: Boolean(workoutExerciseId),
    queryFn: async (): Promise<Set[]> => {
      const result = await supabase
        .from('sets')
        .select('*')
        .eq('workout_exercise_id', workoutExerciseId!)
        .order('set_number');

      return throwIfSupabaseError(result);
    },
  });
}

export function useSetsByWorkout(workoutId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.sets.byWorkout(workoutId ?? ''),
    enabled: Boolean(workoutId),
    queryFn: async (): Promise<Set[]> => {
      const result = await supabase
        .from('sets')
        .select(
          `
          *,
          workout_exercise:workout_exercises!inner (
            workout_id
          )
        `,
        )
        .eq('workout_exercise.workout_id', workoutId!)
        .order('set_number');

      const rows = throwIfSupabaseError(result);
      return rows as Set[];
    },
  });
}

export function useCreateSet() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSetInput) => {
      const parsed = createSetSchema.parse(input);

      const result = await supabase
        .from('sets')
        .insert(parsed satisfies TablesInsert<'sets'>)
        .select('*')
        .single();

      return throwIfSupabaseError(result);
    },
    onSuccess: (data) => {
      if (user) {
        appendSetToActiveWorkoutCache(queryClient, user.id, data);
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.sets.byWorkoutExercise(data.workout_exercise_id),
      });
      void invalidateWorkoutQueriesExceptActive(queryClient);
    },
  });
}

export function useUpdateSet() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: UpdateSetInput & { id: string; workoutExerciseId: string }) => {
      const parsed = updateSetSchema.parse(input);

      const result = await supabase
        .from('sets')
        .update(parsed satisfies TablesUpdate<'sets'>)
        .eq('id', id)
        .select('*')
        .single();

      return throwIfSupabaseError(result);
    },
    onSuccess: (data) => {
      if (user) {
        updateSetInActiveWorkoutCache(queryClient, user.id, data);
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.sets.byWorkoutExercise(data.workout_exercise_id),
      });
      void invalidateWorkoutQueriesExceptActive(queryClient);
      queryClient.invalidateQueries({ queryKey: queryKeys.personalRecords.all });
    },
  });
}

export function useDeleteSet() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      workoutExerciseId,
    }: {
      id: string;
      workoutExerciseId: string;
    }) => {
      const result = await supabase.from('sets').delete().eq('id', id);
      assertSupabaseOk(result);
      return { id, workoutExerciseId };
    },
    onSuccess: ({ id, workoutExerciseId }) => {
      if (user) {
        removeSetFromActiveWorkoutCache(queryClient, user.id, {
          id,
          workout_exercise_id: workoutExerciseId,
        });
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.sets.byWorkoutExercise(workoutExerciseId),
      });
      void invalidateWorkoutQueriesExceptActive(queryClient);
      queryClient.invalidateQueries({ queryKey: queryKeys.personalRecords.all });
    },
  });
}

export function useUpsertSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: CreateSetInput & { id?: string },
    ) => {
      const { id, ...rest } = input;
      const parsed = createSetSchema.parse(rest);

      if (id) {
        const result = await supabase
          .from('sets')
          .update(parsed satisfies TablesUpdate<'sets'>)
          .eq('id', id)
          .select('*')
          .single();

        return throwIfSupabaseError(result);
      }

      const result = await supabase
        .from('sets')
        .insert(parsed satisfies TablesInsert<'sets'>)
        .select('*')
        .single();

      return throwIfSupabaseError(result);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sets.byWorkoutExercise(data.workout_exercise_id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.workouts.all });
    },
  });
}
