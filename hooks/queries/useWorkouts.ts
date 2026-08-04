import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  queryKeys,
  type WorkoutListFilters,
} from '@/hooks/queries/queryKeys';
import {
  clearActiveWorkoutCache,
  invalidateWorkoutQueriesExceptActive,
} from '@/hooks/queries/workoutCache';
import { assertSupabaseOk, throwIfSupabaseError, unwrapSupabaseNullable } from '@/lib/supabase/errors';
import {
  supabase,
  type TablesInsert,
  type TablesUpdate,
  type Workout,
  type WorkoutExercise,
  type WorkoutWithDetails,
} from '@/lib/supabase';
import {
  createWorkoutSchema,
  updateWorkoutSchema,
  type CreateWorkoutInput,
  type UpdateWorkoutInput,
} from '@/lib/validations/training';
import { useAuth } from '@/providers/AuthProvider';

export const WORKOUT_DETAIL_SELECT = `
  *,
  workout_exercises (
    *,
    exercise:exercises (*),
    sets (*)
  )
`;

export function useWorkouts(filters: WorkoutListFilters = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.workouts.list({ ...filters, userId: user?.id }),
    enabled: Boolean(user),
    queryFn: async (): Promise<Workout[]> => {
      let query = supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user!.id)
        .order('started_at', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.from) {
        query = query.gte('started_at', filters.from);
      }

      if (filters.to) {
        query = query.lte('started_at', filters.to);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const result = await query;
      return throwIfSupabaseError(result);
    },
  });
}

export function useActiveWorkout() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.workouts.active(user?.id ?? 'anonymous'),
    enabled: Boolean(user),
    staleTime: 0,
    queryFn: async (): Promise<WorkoutWithDetails | null> => {
      const result = await supabase
        .from('workouts')
        .select(WORKOUT_DETAIL_SELECT)
        .eq('user_id', user!.id)
        .eq('status', 'in_progress')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const data = unwrapSupabaseNullable(result);
      if (!data) return null;

      return normalizeWorkoutDetails(data as WorkoutWithDetails);
    },
  });
}

export function useWorkout(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.workouts.detail(id ?? ''),
    enabled: Boolean(id),
    queryFn: async (): Promise<WorkoutWithDetails> => {
      const result = await supabase
        .from('workouts')
        .select(WORKOUT_DETAIL_SELECT)
        .eq('id', id!)
        .single();

      return normalizeWorkoutDetails(
        throwIfSupabaseError(result) as WorkoutWithDetails,
      );
    },
  });
}

export function useCreateWorkout() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateWorkoutInput) => {
      if (!user) throw new Error('Not authenticated');

      const parsed = createWorkoutSchema.parse(input);

      const result = await supabase
        .from('workouts')
        .insert({
          ...parsed,
          user_id: user.id,
          status: 'in_progress',
        } satisfies TablesInsert<'workouts'>)
        .select('*')
        .single();

      return throwIfSupabaseError(result);
    },
    onSuccess: () => {
      void invalidateWorkoutQueriesExceptActive(queryClient);
    },
  });
}

export function useUpdateWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: UpdateWorkoutInput & { id: string }) => {
      const parsed = updateWorkoutSchema.parse(input);

      const result = await supabase
        .from('workouts')
        .update(parsed satisfies TablesUpdate<'workouts'>)
        .eq('id', id)
        .select('*')
        .single();

      return throwIfSupabaseError(result);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.workouts.detail(data.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.workouts.all });
    },
  });
}

export function useDeleteWorkout() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await supabase.from('workouts').delete().eq('id', id);
      assertSupabaseOk(result);
      return id;
    },
    onSuccess: (id) => {
      if (user) {
        clearActiveWorkoutCache(queryClient, user.id);
        queryClient.setQueryData<Workout[]>(
          queryKeys.workouts.list({ status: 'in_progress', userId: user.id }),
          (current) => current?.filter((workout) => workout.id !== id) ?? [],
        );
      }
      queryClient.removeQueries({ queryKey: queryKeys.workouts.detail(id) });
      void invalidateWorkoutQueriesExceptActive(queryClient);
      queryClient.invalidateQueries({ queryKey: queryKeys.sets.all });
    },
  });
}

/** Deletes every in-progress workout (cleans up duplicate stale sessions). */
export function useClearUnfinishedWorkouts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const result = await supabase
        .from('workouts')
        .delete()
        .eq('user_id', user.id)
        .eq('status', 'in_progress');

      assertSupabaseOk(result);
    },
    onSuccess: () => {
      if (user) {
        clearActiveWorkoutCache(queryClient, user.id);
        queryClient.setQueryData<Workout[]>(
          queryKeys.workouts.list({ status: 'in_progress', userId: user.id }),
          [],
        );
      }
      void invalidateWorkoutQueriesExceptActive(queryClient);
      queryClient.invalidateQueries({ queryKey: queryKeys.sets.all });
    },
  });
}

export function useAddWorkoutExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workoutId,
      exerciseId,
      orderIndex,
      notes,
    }: {
      workoutId: string;
      exerciseId: string;
      orderIndex: number;
      notes?: string | null;
    }) => {
      const result = await supabase
        .from('workout_exercises')
        .insert({
          workout_id: workoutId,
          exercise_id: exerciseId,
          order_index: orderIndex,
          notes: notes ?? null,
        } satisfies TablesInsert<'workout_exercises'>)
        .select('*')
        .single();

      return throwIfSupabaseError(result);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.workouts.detail(data.workout_id),
      });
      void invalidateWorkoutQueriesExceptActive(queryClient);
    },
  });
}

export function useRemoveWorkoutExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      workoutId,
    }: {
      id: string;
      workoutId: string;
    }) => {
      const result = await supabase
        .from('workout_exercises')
        .delete()
        .eq('id', id);

      assertSupabaseOk(result);
      return { id, workoutId };
    },
    onSuccess: ({ workoutId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.workouts.detail(workoutId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.sets.byWorkout(workoutId) });
    },
  });
}

export function normalizeWorkoutDetails(
  workout: WorkoutWithDetails,
): WorkoutWithDetails {
  return {
    ...workout,
    workout_exercises: [...(workout.workout_exercises ?? [])]
      .sort((a, b) => a.order_index - b.order_index)
      .map((we) => ({
        ...we,
        sets: [...(we.sets ?? [])].sort((a, b) => a.set_number - b.set_number),
      })),
  };
}

export type { WorkoutExercise };
