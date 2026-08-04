import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/hooks/queries/queryKeys';
import {
  computeMuscleBalance,
  muscleBalanceQueryStart,
  type MuscleBalancePoint,
} from '@/lib/muscleBalance';
import { throwIfSupabaseError } from '@/lib/supabase/errors';
import { supabase, type WorkoutWithDetails } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export interface MuscleBalanceData {
  points: MuscleBalancePoint[];
}

const MUSCLE_BALANCE_SELECT = `
  id,
  status,
  started_at,
  workout_exercises (
    id,
    exercise:exercises ( muscle_group ),
    sets ( weight, reps, is_warmup, completed_at )
  )
`;

export function useMuscleBalance() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...queryKeys.workouts.lists(), 'muscle-balance', user?.id] as const,
    enabled: Boolean(user),
    queryFn: async (): Promise<MuscleBalanceData> => {
      const since = muscleBalanceQueryStart();

      const result = await supabase
        .from('workouts')
        .select(MUSCLE_BALANCE_SELECT)
        .eq('user_id', user!.id)
        .eq('status', 'completed')
        .gte('started_at', since)
        .order('started_at', { ascending: false });

      const workouts = throwIfSupabaseError(result) as WorkoutWithDetails[];
      const points = computeMuscleBalance(workouts);

      return { points };
    },
  });
}
