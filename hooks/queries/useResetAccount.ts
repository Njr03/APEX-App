import { useMutation, useQueryClient } from '@tanstack/react-query';

import { DEFAULT_DASHBOARD_CARDS } from '@/lib/dashboard/dashboardCards';
import { throwIfSupabaseError } from '@/lib/supabase/errors';
import { supabase } from '@/lib/supabase';
import { useDashboardCardsStore } from '@/stores/dashboardCardsStore';
import { useWorkoutSessionStore } from '@/stores/workoutSessionStore';

export function useResetAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await supabase.rpc('reset_user_account');
      throwIfSupabaseError(result);
    },
    onSuccess: async () => {
      useWorkoutSessionStore.getState().resetSession();
      await useDashboardCardsStore.getState().setCards(DEFAULT_DASHBOARD_CARDS);
      await queryClient.invalidateQueries();
    },
  });
}
