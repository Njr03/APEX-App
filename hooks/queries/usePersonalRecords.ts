import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  queryKeys,
  type PersonalRecordListFilters,
} from '@/hooks/queries/queryKeys';
import { throwIfSupabaseError } from '@/lib/supabase/errors';
import {
  supabase,
  type PersonalRecord,
  type PersonalRecordWithExercise,
  type TablesInsert,
  type TablesUpdate,
} from '@/lib/supabase';
import {
  createPersonalRecordSchema,
  type CreatePersonalRecordInput,
} from '@/lib/validations/training';
import { useAuth } from '@/providers/AuthProvider';

export function usePersonalRecords(filters: PersonalRecordListFilters = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.personalRecords.list({
      ...filters,
      userId: user?.id,
    }),
    enabled: Boolean(user),
    queryFn: async (): Promise<PersonalRecordWithExercise[]> => {
      let query = supabase
        .from('personal_records')
        .select(
          `
          *,
          exercise:exercises (*)
        `,
        )
        .eq('user_id', user!.id)
        .order('achieved_at', { ascending: false });

      if (filters.exerciseId) {
        query = query.eq('exercise_id', filters.exerciseId);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const result = await query;
      return throwIfSupabaseError(result) as PersonalRecordWithExercise[];
    },
  });
}

export function usePersonalRecordsByExercise(exerciseId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.personalRecords.byExercise(exerciseId ?? ''),
    enabled: Boolean(user && exerciseId),
    queryFn: async (): Promise<PersonalRecord[]> => {
      const result = await supabase
        .from('personal_records')
        .select('*')
        .eq('user_id', user!.id)
        .eq('exercise_id', exerciseId!);

      return throwIfSupabaseError(result);
    },
  });
}

export type WorkoutSessionRecord = PersonalRecord & {
  exercise: { name: string };
};

export function useWorkoutSessionRecords(setIds: string[]) {
  const { user } = useAuth();
  const sortedKey = [...setIds].sort().join(',');

  return useQuery({
    queryKey: [
      ...queryKeys.personalRecords.all,
      'session',
      user?.id,
      sortedKey,
    ] as const,
    enabled: Boolean(user) && setIds.length > 0,
    queryFn: async (): Promise<WorkoutSessionRecord[]> => {
      const result = await supabase
        .from('personal_records')
        .select(
          `
          *,
          exercise:exercises (name)
        `,
        )
        .eq('user_id', user!.id)
        .in('set_id', setIds)
        .order('achieved_at', { ascending: true });

      return throwIfSupabaseError(result) as WorkoutSessionRecord[];
    },
  });
}

export function useUpsertPersonalRecord() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePersonalRecordInput) => {
      if (!user) throw new Error('Not authenticated');

      const parsed = createPersonalRecordSchema.parse(input);

      const result = await supabase
        .from('personal_records')
        .upsert(
          {
            ...parsed,
            user_id: user.id,
          } satisfies TablesInsert<'personal_records'>,
          { onConflict: 'user_id,exercise_id,record_type' },
        )
        .select('*')
        .single();

      return throwIfSupabaseError(result);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personalRecords.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.personalRecords.byExercise(data.exercise_id),
      });
    },
  });
}

export function useUpdatePersonalRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: Partial<CreatePersonalRecordInput> & { id: string }) => {
      const parsed = createPersonalRecordSchema.partial().parse(input);

      const result = await supabase
        .from('personal_records')
        .update(parsed satisfies TablesUpdate<'personal_records'>)
        .eq('id', id)
        .select('*')
        .single();

      return throwIfSupabaseError(result);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personalRecords.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.personalRecords.byExercise(data.exercise_id),
      });
    },
  });
}

export function useRecentPersonalRecords(days = 7) {
  const { user } = useAuth();

  return useQuery({
    queryKey: [
      ...queryKeys.personalRecords.lists(),
      'recent',
      user?.id,
      days,
    ] as const,
    enabled: Boolean(user),
    queryFn: async (): Promise<PersonalRecordWithExercise[]> => {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const result = await supabase
        .from('personal_records')
        .select(
          `
          *,
          exercise:exercises (*)
        `,
        )
        .eq('user_id', user!.id)
        .gte('achieved_at', since.toISOString())
        .order('achieved_at', { ascending: false });

      return throwIfSupabaseError(result) as PersonalRecordWithExercise[];
    },
  });
}
