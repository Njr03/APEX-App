import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/hooks/queries/queryKeys';
import {
  routineSummariesQueryKey,
  type RoutineSummary,
} from '@/hooks/queries/useRoutineSummaries';
import { invalidateDashboardMetrics } from '@/hooks/queries/workoutCache';
import { upsertRoutineSummary } from '@/lib/routines/sessionWorkouts';
import { assertSupabaseOk, throwIfSupabaseError } from '@/lib/supabase/errors';
import {
  supabase,
  type Routine,
  type RoutineExercise,
  type RoutineWithExercises,
  type TablesInsert,
  type TablesUpdate,
} from '@/lib/supabase';
import {
  createRoutineSchema,
  routineExerciseSchema,
  type CreateRoutineInput,
  type RoutineExerciseInput,
} from '@/lib/validations/training';
import { useAuth } from '@/providers/AuthProvider';

export function useRoutines() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.routines.list(user?.id ?? 'anonymous'),
    enabled: Boolean(user),
    queryFn: async (): Promise<Routine[]> => {
      const result = await supabase
        .from('routines')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      return throwIfSupabaseError(result);
    },
  });
}

export function useRoutine(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.routines.detail(id ?? ''),
    enabled: Boolean(id),
    queryFn: async (): Promise<RoutineWithExercises> => {
      const result = await supabase
        .from('routines')
        .select(
          `
          *,
          routine_exercises (
            *,
            exercise:exercises (*)
          )
        `,
        )
        .eq('id', id!)
        .single();

      const data = throwIfSupabaseError(result);

      return {
        ...data,
        routine_exercises: [...(data.routine_exercises ?? [])].sort(
          (a, b) => a.order_index - b.order_index,
        ),
      } as RoutineWithExercises;
    },
  });
}

export function useCreateRoutine() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRoutineInput) => {
      if (!user) throw new Error('Not authenticated');

      const parsed = createRoutineSchema.parse(input);

      const result = await supabase
        .from('routines')
        .insert({
          ...parsed,
          user_id: user.id,
        } satisfies TablesInsert<'routines'>)
        .select('*')
        .single();

      return throwIfSupabaseError(result);
    },
    onSuccess: (data, _variables, _context) => {
      if (!user) return;

      const summary: RoutineSummary = {
        ...data,
        exercise_count: 0,
        last_used_at: null,
        target_muscles: 'No exercises yet',
      };

      queryClient.setQueryData<RoutineSummary[]>(
        routineSummariesQueryKey(user.id),
        (current) => upsertRoutineSummary(current, summary),
      );

      queryClient.setQueriesData<Routine[]>(
        { queryKey: queryKeys.routines.lists() },
        (current) => {
          if (!current?.length) return [data];
          if (!current.some((routine) => routine.id === data.id)) {
            return [data, ...current];
          }

          return current.map((routine) =>
            routine.id === data.id ? data : routine,
          );
        },
      );

      queryClient.invalidateQueries({ queryKey: queryKeys.routines.all });
      void invalidateDashboardMetrics(queryClient, user?.id);
    },
  });
}

export function useUpdateRoutine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: Partial<CreateRoutineInput> & { id: string }) => {
      const parsed = createRoutineSchema.partial().parse(input);

      const result = await supabase
        .from('routines')
        .update(parsed satisfies TablesUpdate<'routines'>)
        .eq('id', id)
        .select('*')
        .single();

      return throwIfSupabaseError(result);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.routines.detail(data.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.routines.all });
      void invalidateDashboardMetrics(queryClient);
    },
  });
}

export function useDeleteRoutine() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await supabase.from('routines').delete().eq('id', id);
      assertSupabaseOk(result);
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.routines.all });

      if (user) {
        queryClient.setQueryData<RoutineSummary[]>(
          routineSummariesQueryKey(user.id),
          (current) => current?.filter((routine) => routine.id !== id),
        );
      }

      queryClient.setQueriesData<RoutineSummary[]>(
        { queryKey: queryKeys.routines.lists() },
        (current) => current?.filter((routine) => routine.id !== id),
      );

      queryClient.setQueriesData<Routine[]>(
        { queryKey: queryKeys.routines.lists() },
        (current) => current?.filter((routine) => routine.id !== id),
      );
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: queryKeys.routines.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.routines.all });
      void invalidateDashboardMetrics(queryClient, user?.id);
    },
  });
}

export function useUpsertRoutineExercises() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      routineId,
      exercises,
    }: {
      routineId: string;
      exercises: RoutineExerciseInput[];
    }) => {
      const parsed = exercises.map((item) => routineExerciseSchema.parse(item));

      const deleteResult = await supabase
        .from('routine_exercises')
        .delete()
        .eq('routine_id', routineId);

      assertSupabaseOk(deleteResult);

      if (parsed.length === 0) {
        return [] as RoutineExercise[];
      }

      const insertResult = await supabase
        .from('routine_exercises')
        .insert(
          parsed.map((item) => ({
            ...item,
            routine_id: routineId,
          })) satisfies TablesInsert<'routine_exercises'>[],
        )
        .select('*');

      return throwIfSupabaseError(insertResult);
    },
    onSuccess: (_data, variables) => {
      if (user) {
        queryClient.setQueryData<RoutineSummary[]>(
          routineSummariesQueryKey(user.id),
          (current) =>
            current?.map((routine) =>
              routine.id === variables.routineId
                ? { ...routine, exercise_count: variables.exercises.length }
                : routine,
            ),
        );
      }

      queryClient.invalidateQueries({
        queryKey: queryKeys.routines.detail(variables.routineId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.routines.all });
      void invalidateDashboardMetrics(queryClient, user?.id);
    },
  });
}
