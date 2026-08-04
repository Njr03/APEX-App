import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/hooks/queries/queryKeys';
import { throwIfSupabaseError } from '@/lib/supabase/errors';
import { supabase, type Profile, type TablesUpdate } from '@/lib/supabase';
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from '@/lib/validations/training';
import { useAuth } from '@/providers/AuthProvider';

export function useProfile() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: queryKeys.profile.detail(userId ?? 'anonymous'),
    enabled: Boolean(userId),
    queryFn: async (): Promise<Profile> => {
      const result = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId!)
        .single();

      return throwIfSupabaseError(result);
    },
  });
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      if (!user) throw new Error('Not authenticated');

      const parsed = updateProfileSchema.parse(input);

      const result = await supabase
        .from('profiles')
        .update(parsed satisfies TablesUpdate<'profiles'>)
        .eq('id', user.id)
        .select('*')
        .single();

      return throwIfSupabaseError(result);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.profile.detail(data.id), data);
    },
  });
}
