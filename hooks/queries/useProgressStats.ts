import { subWeeks } from 'date-fns';
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/hooks/queries/queryKeys';
import {
  bucketWeeklyVolume,
  buildHeatmapDays,
  getTrainingDayKeys,
  type WeeklyVolumeBucket,
} from '@/lib/progress/stats';
import { throwIfSupabaseError } from '@/lib/supabase/errors';
import { supabase, type Workout } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export type WorkoutHistoryRow = Workout & {
  workout_exercises?: Array<{
    id: string;
    sets?: Array<{ is_pr?: boolean | null; completed_at?: string | null }> | null;
  }> | null;
};

export function workoutHistoryQueryKey(userId: string) {
  return [...queryKeys.workouts.lists(), 'history', userId] as const;
}

export interface ProgressStats {
  workouts: Workout[];
  weeklyVolume: WeeklyVolumeBucket[];
  trainingDays: Set<string>;
  heatmapDays: Array<{ date: string; count: number; volume: number }>;
}

export async function fetchWorkoutHistory(userId: string): Promise<WorkoutHistoryRow[]> {
  const result = await supabase
    .from('workouts')
    .select(
      `
      *,
      workout_exercises (
        id,
        sets ( is_pr, completed_at )
      )
    `,
    )
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('started_at', { ascending: false });

  return throwIfSupabaseError(result) as WorkoutHistoryRow[];
}

export function useWorkoutHistory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: workoutHistoryQueryKey(user?.id ?? 'anonymous'),
    enabled: Boolean(user),
    queryFn: async (): Promise<WorkoutHistoryRow[]> => fetchWorkoutHistory(user!.id),
  });
}

export function useProgressStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...queryKeys.workouts.lists(), 'progress-stats', user?.id] as const,
    enabled: Boolean(user),
    queryFn: async (): Promise<ProgressStats> => {
      const since = subWeeks(new Date(), 12).toISOString();

      const result = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user!.id)
        .eq('status', 'completed')
        .gte('started_at', since)
        .order('started_at', { ascending: false });

      const recentWorkouts = throwIfSupabaseError(result);

      const heatmapResult = await supabase
        .from('workouts')
        .select('started_at, total_volume, status')
        .eq('user_id', user!.id)
        .eq('status', 'completed')
        .gte('started_at', subWeeks(new Date(), 13).toISOString());

      const heatmapWorkouts = throwIfSupabaseError(heatmapResult) as Workout[];

      return {
        workouts: recentWorkouts,
        weeklyVolume: bucketWeeklyVolume(recentWorkouts, 12),
        trainingDays: getTrainingDayKeys(recentWorkouts),
        heatmapDays: buildHeatmapDays(heatmapWorkouts, 91),
      };
    },
  });
}

export function useCompletedWorkouts(limit?: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.workouts.list({
      userId: user?.id,
      status: 'completed',
      limit,
    }),
    enabled: Boolean(user),
    queryFn: async (): Promise<Workout[]> => {
      let query = supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user!.id)
        .eq('status', 'completed')
        .order('started_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      return throwIfSupabaseError(await query);
    },
  });
}
