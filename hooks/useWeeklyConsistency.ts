import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/hooks/queries/queryKeys';
import {
  buildWeeklyConsistencyEntries,
  summarizeWeeklyConsistency,
  weeklyConsistencyQueryStart,
  type WeeklyConsistencyEntry,
  type WeeklyConsistencySummary,
} from '@/lib/training/weeklyConsistency';
import { throwIfSupabaseError } from '@/lib/supabase/errors';
import { supabase, type Workout } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export interface WeeklyConsistencyData {
  entries: WeeklyConsistencyEntry[];
  summary: WeeklyConsistencySummary;
}

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
        .select('id, name, status, started_at')
        .eq('user_id', user!.id)
        .eq('status', 'completed')
        .gte('started_at', since)
        .order('started_at', { ascending: false });

      const workouts = throwIfSupabaseError(result) as Workout[];
      const entries = buildWeeklyConsistencyEntries(workouts);

      return {
        entries,
        summary: summarizeWeeklyConsistency(entries),
      };
    },
  });
}
