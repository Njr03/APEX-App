import { startOfWeek } from 'date-fns';
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/hooks/queries/queryKeys';
import { useProfile } from '@/hooks/queries';
import { formatStreakDelta, type StatDeltaTone } from '@/lib/dashboard/statTiles';
import { toCalendarDayKey } from '@/lib/streak';
import { throwIfSupabaseError } from '@/lib/supabase/errors';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export interface StreakMetrics {
  currentStreak: number;
  longestStreak: number;
  trainingDaysThisWeek: number;
  delta: {
    label: string;
    tone: StatDeltaTone;
  };
}

export function formatStreakHeaderLabel(
  streak: number,
  deltaLabel?: string,
): string {
  const countLabel = streak === 1 ? '1 day' : `${streak} days`;

  if (streak === 0) {
    return deltaLabel ?? 'No streak';
  }

  return deltaLabel ? `${countLabel} · ${deltaLabel}` : countLabel;
}

export function useStreakMetrics() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();

  const query = useQuery({
    queryKey: [...queryKeys.workouts.lists(), 'streak-metrics', user?.id] as const,
    enabled: Boolean(user && profile),
    queryFn: async (): Promise<StreakMetrics> => {
      const now = new Date();
      const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString();

      const result = await supabase
        .from('workouts')
        .select('started_at')
        .eq('user_id', user!.id)
        .eq('status', 'completed')
        .gte('started_at', thisWeekStart);

      const workouts = throwIfSupabaseError(result);
      const trainingDaysThisWeek = new Set(
        workouts.map((workout) => toCalendarDayKey(workout.started_at)),
      ).size;

      const currentStreak = profile!.current_streak ?? 0;
      const longestStreak = profile!.longest_streak ?? 0;
      const delta = formatStreakDelta({
        currentStreak,
        longestStreak,
        trainingDaysThisWeek,
      });

      return {
        currentStreak,
        longestStreak,
        trainingDaysThisWeek,
        delta,
      };
    },
  });

  const fallbackMetrics: StreakMetrics | undefined = profile
    ? {
        currentStreak: profile.current_streak ?? 0,
        longestStreak: profile.longest_streak ?? 0,
        trainingDaysThisWeek: 0,
        delta: formatStreakDelta({
          currentStreak: profile.current_streak ?? 0,
          longestStreak: profile.longest_streak ?? 0,
          trainingDaysThisWeek: 0,
        }),
      }
    : undefined;

  return {
    data: query.data ?? fallbackMetrics,
    isLoading: profileLoading || query.isLoading,
  };
}
