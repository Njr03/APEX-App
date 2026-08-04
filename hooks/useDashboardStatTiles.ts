import {
  differenceInCalendarWeeks,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subWeeks,
} from 'date-fns';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/hooks/queries/queryKeys';
import {
  formatStatVolumeK,
  formatStreakDelta,
  formatVolumeDeltaPercent,
  getPlannedSessionsYtd,
  type StatDeltaTone,
} from '@/lib/dashboard/statTiles';
import { getVolumeComparison } from '@/lib/dashboard/stats';
import { toCalendarDayKey } from '@/lib/streak';
import { throwIfSupabaseError } from '@/lib/supabase/errors';
import { supabase, type Workout } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export interface StatTileData {
  label: string;
  value: string;
  unit?: string;
  accentColor: string;
  delta: string;
  deltaTone: StatDeltaTone;
}

export interface DashboardStatTiles {
  tiles: StatTileData[];
  breakdown: StatTileBreakdown;
}

export interface StatTileBreakdown {
  streak: {
    currentStreak: number;
    longestStreak: number;
    trainingDaysThisWeek: number;
  };
  volume: {
    thisWeekKg: number;
    lastWeekKg: number;
    deltaKg: number;
    deltaPercent: number | null;
    sessionsThisWeek: number;
  };
  sessions: {
    completedYtd: number;
    plannedYtd: number;
    completionPercent: number;
  };
  prs: {
    total: number;
    thisMonth: number;
  };
}

const TILE_COLORS = {
  gold: '#f5c842',
  lime: '#c8ff5a',
  cyan: '#38d9f5',
} as const;

export function useDashboardStatTiles(unit: 'kg' | 'lb' = 'kg') {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...queryKeys.workouts.lists(), 'stat-tiles', user?.id, unit] as const,
    enabled: Boolean(user),
    queryFn: async (): Promise<DashboardStatTiles> => {
      const now = new Date();
      const twoWeekWindowStart = startOfWeek(subWeeks(now, 1), {
        weekStartsOn: 1,
      }).toISOString();
      const yearStart = startOfYear(now).toISOString();
      const monthStart = startOfMonth(now).toISOString();

      const [
        profileResult,
        recentWorkoutsResult,
        sessionsYtdResult,
        totalPrsResult,
        monthPrsResult,
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user!.id).single(),
        supabase
          .from('workouts')
          .select('started_at, total_volume, status')
          .eq('user_id', user!.id)
          .eq('status', 'completed')
          .gte('started_at', twoWeekWindowStart)
          .order('started_at', { ascending: false }),
        supabase
          .from('workouts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user!.id)
          .eq('status', 'completed')
          .gte('started_at', yearStart),
        supabase
          .from('personal_records')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user!.id),
        supabase
          .from('personal_records')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user!.id)
          .gte('achieved_at', monthStart),
      ]);

      const profile = throwIfSupabaseError(profileResult);
      const recentWorkouts = throwIfSupabaseError(
        recentWorkoutsResult,
      ) as Workout[];
      const sessionsYtd = sessionsYtdResult.count ?? 0;
      const totalPrs = totalPrsResult.count ?? 0;
      const prsThisMonth = monthPrsResult.count ?? 0;

      if (sessionsYtdResult.error) throw sessionsYtdResult.error;
      if (totalPrsResult.error) throw totalPrsResult.error;
      if (monthPrsResult.error) throw monthPrsResult.error;

      const volumeComparison = getVolumeComparison(recentWorkouts, now);
      const volumeDeltaPercent =
        volumeComparison.lastWeek > 0
          ? ((volumeComparison.thisWeek - volumeComparison.lastWeek) /
              volumeComparison.lastWeek) *
            100
          : null;
      const volumeFormatted = formatStatVolumeK(volumeComparison.thisWeek, unit);
      const volumeDelta = formatVolumeDeltaPercent(volumeDeltaPercent);
      const plannedSessions = getPlannedSessionsYtd(now);
      const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
      const sessionsThisWeek = recentWorkouts.filter((workout) => {
        const startedAt = new Date(workout.started_at);
        return startedAt >= thisWeekStart;
      }).length;
      const trainingDaysThisWeek = new Set(
        recentWorkouts
          .filter((workout) => new Date(workout.started_at) >= thisWeekStart)
          .map((workout) => toCalendarDayKey(workout.started_at)),
      ).size;
      const currentStreak = profile.current_streak ?? 0;
      const longestStreak = profile.longest_streak ?? 0;
      const streakDelta = formatStreakDelta({
        currentStreak,
        longestStreak,
        trainingDaysThisWeek,
      });
      const completionPercent =
        plannedSessions > 0
          ? Math.round((sessionsYtd / plannedSessions) * 100)
          : 0;

      const tiles: StatTileData[] = [
        {
          label: 'Streak',
          value: String(currentStreak),
          unit: currentStreak === 1 ? ' day' : ' days',
          accentColor: TILE_COLORS.gold,
          delta: streakDelta.label,
          deltaTone: streakDelta.tone,
        },
        {
          label: "This Week's Volume",
          value: volumeFormatted.value,
          unit: volumeFormatted.unit,
          accentColor: TILE_COLORS.lime,
          delta: volumeDelta.label,
          deltaTone: volumeDelta.tone,
        },
        {
          label: 'Sessions This Year',
          value: String(sessionsYtd),
          accentColor: TILE_COLORS.cyan,
          delta: `of ${plannedSessions} planned`,
          deltaTone: sessionsYtd >= plannedSessions ? 'positive' : 'neutral',
        },
        {
          label: 'Total PRs',
          value: String(totalPrs),
          accentColor: TILE_COLORS.gold,
          delta:
            prsThisMonth > 0
              ? `${prsThisMonth} this month`
              : 'None this month',
          deltaTone: prsThisMonth > 0 ? 'positive' : 'neutral',
        },
      ];

      return {
        tiles,
        breakdown: {
          streak: {
            currentStreak,
            longestStreak,
            trainingDaysThisWeek,
          },
          volume: {
            thisWeekKg: volumeComparison.thisWeek,
            lastWeekKg: volumeComparison.lastWeek,
            deltaKg: volumeComparison.delta,
            deltaPercent: volumeDeltaPercent,
            sessionsThisWeek,
          },
          sessions: {
            completedYtd: sessionsYtd,
            plannedYtd: plannedSessions,
            completionPercent,
          },
          prs: {
            total: totalPrs,
            thisMonth: prsThisMonth,
          },
        },
      };
    },
  });
}
