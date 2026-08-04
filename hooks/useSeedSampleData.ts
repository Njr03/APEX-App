import { useMutation, useQueryClient } from '@tanstack/react-query';

import { seedSampleData } from '@/lib/demo/seedSampleData';
import { useAuth } from '@/providers/AuthProvider';

export function useSeedSampleData() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      return seedSampleData(user.id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
  });
}
