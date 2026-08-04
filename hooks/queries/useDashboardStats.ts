import { subWeeks } from 'date-fns';
import { useQuery } from '@tanstack/react-query';

import {
  getDailyVolumeSeries,
  getVolumeComparison,
  type DailyVolumePoint,
  type VolumeComparison,
} from '@/lib/dashboard/stats';
import { queryKeys } from '@/hooks/queries/queryKeys';
import { getStreakDisplayState, type StreakDisplayState } from '@/lib/streak';
import { throwIfSupabaseError, unwrapSupabaseNullable } from '@/lib/supabase/errors';
import { supabase, type Workout } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export interface DashboardStats {
  workouts: Workout[];
  volumeComparison: VolumeComparison;
  dailyVolume: DailyVolumePoint[];
  streakState: StreakDisplayState;
  lastCompletedAt: string | null;
}

export function useDashboardStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...queryKeys.workouts.lists(), 'dashboard', user?.id] as const,
    enabled: Boolean(user),
    queryFn: async (): Promise<DashboardStats> => {
      const since = subWeeks(new Date(), 3).toISOString();

      const [profileResult, workoutsResult, lastWorkoutResult] =
        await Promise.all([
          supabase.from('profiles').select('*').eq('id', user!.id).single(),
          supabase
            .from('workouts')
            .select('*')
            .eq('user_id', user!.id)
            .eq('status', 'completed')
            .gte('started_at', since)
            .order('started_at', { ascending: false }),
          supabase
            .from('workouts')
            .select('completed_at')
            .eq('user_id', user!.id)
            .eq('status', 'completed')
            .order('completed_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

      const profile = throwIfSupabaseError(profileResult);
      const workouts = throwIfSupabaseError(workoutsResult);
      const lastWorkout = unwrapSupabaseNullable(lastWorkoutResult);

      const streakState = getStreakDisplayState(
        profile.current_streak,
        lastWorkout?.completed_at ?? null,
      );

      return {
        workouts,
        volumeComparison: getVolumeComparison(workouts),
        dailyVolume: getDailyVolumeSeries(workouts, 7),
        streakState,
        lastCompletedAt: lastWorkout?.completed_at ?? null,
      };
    },
  });
}
