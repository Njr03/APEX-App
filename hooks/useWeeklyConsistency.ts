import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/hooks/queries/queryKeys';
import {
  buildWeeklyConsistencyEntries,
  summarizeWeeklyConsistency,
  weeklyConsistencyQueryStart,
  type WeeklyConsistencyData,
  type WeeklyConsistencyEntry,
  type WeeklyConsistencySummary,
  type WorkoutForWeeklyConsistency,
} from '@/lib/training/weeklyConsistency';
import { throwIfSupabaseError } from '@/lib/supabase/errors';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export type { WeeklyConsistencyData, WeeklyConsistencyEntry, WeeklyConsistencySummary };

const WEEKLY_CONSISTENCY_SELECT = `
  id,
  name,
  status,
  started_at,
  completed_at,
  routine_id,
  routines ( name ),
  workout_exercises (
    exercise:exercises ( muscle_group )
  )
`;

export function useWeeklyConsistency() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...queryKeys.workouts.lists(), 'weekly-consistency', user?.id] as const,
    enabled: Boolean(user),
    staleTime: 0,
    refetchOnMount: 'always',
    queryFn: async (): Promise<WeeklyConsistencyData> => {
      const since = weeklyConsistencyQueryStart();

      const result = await supabase
        .from('workouts')
        .select(WEEKLY_CONSISTENCY_SELECT)
        .eq('user_id', user!.id)
        .eq('status', 'completed')
        .gte('started_at', since)
        .order('completed_at', { ascending: false });

      const workouts = throwIfSupabaseError(result) as WorkoutForWeeklyConsistency[];
      const entries = buildWeeklyConsistencyEntries(workouts);

      return {
        entries,
        summary: summarizeWeeklyConsistency(entries),
      };
    },
  });
}
