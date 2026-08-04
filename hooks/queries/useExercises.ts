import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  queryKeys,
  type ExerciseListFilters,
} from '@/hooks/queries/queryKeys';
import { assertSupabaseOk, throwIfSupabaseError } from '@/lib/supabase/errors';
import {
  supabase,
  type Exercise,
  type TablesInsert,
  type TablesUpdate,
} from '@/lib/supabase';
import {
  createExerciseSchema,
  type CreateExerciseInput,
} from '@/lib/validations/training';
import { useAuth } from '@/providers/AuthProvider';

export function useExercises(filters: ExerciseListFilters = {}) {
  return useQuery({
    queryKey: queryKeys.exercises.list(filters),
    queryFn: async (): Promise<Exercise[]> => {
      let query = supabase.from('exercises').select('*').order('name');

      if (filters.muscleGroup) {
        query = query.eq('muscle_group', filters.muscleGroup);
      }

      if (filters.equipment) {
        query = query.eq('equipment', filters.equipment);
      }

      if (filters.customOnly) {
        query = query.eq('is_custom', true);
      }

      if (filters.search?.trim()) {
        query = query.ilike('name', `%${filters.search.trim()}%`);
      }

      const result = await query;
      return throwIfSupabaseError(result);
    },
  });
}

export function useExercise(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.exercises.detail(id ?? ''),
    enabled: Boolean(id),
    queryFn: async (): Promise<Exercise> => {
      const result = await supabase
        .from('exercises')
        .select('*')
        .eq('id', id!)
        .single();

      return throwIfSupabaseError(result);
    },
  });
}

export function useCreateExercise() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateExerciseInput) => {
      if (!user) throw new Error('Not authenticated');

      const parsed = createExerciseSchema.parse(input);

      const result = await supabase
        .from('exercises')
        .insert({
          ...parsed,
          is_custom: true,
          created_by: user.id,
        } satisfies TablesInsert<'exercises'>)
        .select('*')
        .single();

      return throwIfSupabaseError(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all });
    },
  });
}

export function useUpdateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: Partial<CreateExerciseInput> & { id: string }) => {
      const parsed = createExerciseSchema.partial().parse(input);

      const result = await supabase
        .from('exercises')
        .update(parsed satisfies TablesUpdate<'exercises'>)
        .eq('id', id)
        .select('*')
        .single();

      return throwIfSupabaseError(result);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.exercises.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all });
    },
  });
}

export function useDeleteExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await supabase
        .from('exercises')
        .delete()
        .eq('id', id)
        .select('id')
        .maybeSingle();

      if (result.error) {
        throw result.error;
      }

      if (!result.data) {
        throw new Error(
          'Exercise could not be deleted. It may already be removed or you may not have permission.',
        );
      }

      return id;
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: queryKeys.exercises.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all });
    },
  });
}
