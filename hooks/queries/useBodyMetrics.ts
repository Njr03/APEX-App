import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/hooks/queries/queryKeys';
import { assertSupabaseOk, throwIfSupabaseError } from '@/lib/supabase/errors';
import {
  supabase,
  type BodyMetric,
  type TablesInsert,
  type TablesUpdate,
} from '@/lib/supabase';
import {
  createBodyMetricSchema,
  type CreateBodyMetricInput,
} from '@/lib/validations/training';
import { useAuth } from '@/providers/AuthProvider';

export function useBodyMetrics() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.bodyMetrics.list(user?.id ?? 'anonymous'),
    enabled: Boolean(user),
    queryFn: async (): Promise<BodyMetric[]> => {
      const result = await supabase
        .from('body_metrics')
        .select('*')
        .eq('user_id', user!.id)
        .order('date', { ascending: false });

      return throwIfSupabaseError(result);
    },
  });
}

export function useUpsertBodyMetric() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBodyMetricInput) => {
      if (!user) throw new Error('Not authenticated');

      const parsed = createBodyMetricSchema.parse(input);

      const result = await supabase
        .from('body_metrics')
        .upsert(
          {
            ...parsed,
            user_id: user.id,
          } satisfies TablesInsert<'body_metrics'>,
          { onConflict: 'user_id,date' },
        )
        .select('*')
        .single();

      return throwIfSupabaseError(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bodyMetrics.all });
    },
  });
}

export function useUpdateBodyMetric() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: Partial<CreateBodyMetricInput> & { id: string }) => {
      const parsed = createBodyMetricSchema.partial().parse(input);

      const result = await supabase
        .from('body_metrics')
        .update(parsed satisfies TablesUpdate<'body_metrics'>)
        .eq('id', id)
        .select('*')
        .single();

      return throwIfSupabaseError(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bodyMetrics.all });
    },
  });
}

export function useDeleteBodyMetric() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await supabase.from('body_metrics').delete().eq('id', id);
      assertSupabaseOk(result);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bodyMetrics.all });
    },
  });
}
