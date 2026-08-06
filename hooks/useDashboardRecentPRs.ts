import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/hooks/queries/queryKeys';
import {
  DASHBOARD_RECENT_PR_FETCH_LIMIT,
  dedupeRecentPRsByExercise,
  mapRecentPRRow,
  RECENT_PR_SELECT,
  type RecentPRRawRow,
} from '@/lib/dashboard/recentPRs';
import { throwIfSupabaseError } from '@/lib/supabase/errors';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export function useDashboardRecentPRs(unit: 'kg' | 'lb' = 'kg') {
  const { user } = useAuth();

  return useQuery({
    queryKey: [
      ...queryKeys.personalRecords.lists(),
      'dashboard-recent',
      user?.id,
      unit,
    ] as const,
    enabled: Boolean(user),
    staleTime: 0,
    refetchOnMount: 'always',
    queryFn: async () => {
      const result = await supabase
        .from('personal_records')
        .select(RECENT_PR_SELECT)
        .eq('user_id', user!.id)
        .order('achieved_at', { ascending: false })
        .limit(DASHBOARD_RECENT_PR_FETCH_LIMIT);

      const rows = throwIfSupabaseError(result) as RecentPRRawRow[];
      const deduped = dedupeRecentPRsByExercise(rows);

      const workoutExerciseIds = [
        ...new Set(
          deduped
            .map((row) => row.set?.workout_exercise_id)
            .filter((id): id is string => Boolean(id)),
        ),
      ];

      const setCounts = new Map<string, number>();

      if (workoutExerciseIds.length > 0) {
        const setsResult = await supabase
          .from('sets')
          .select('workout_exercise_id, completed_at, is_warmup')
          .in('workout_exercise_id', workoutExerciseIds);

        for (const set of throwIfSupabaseError(setsResult)) {
          if (!set.completed_at || set.is_warmup) continue;
          setCounts.set(
            set.workout_exercise_id,
            (setCounts.get(set.workout_exercise_id) ?? 0) + 1,
          );
        }
      }

      const mapped = await Promise.all(
        deduped.map(async (row) => {
          const previous = await supabase
            .from('personal_records')
            .select('value')
            .eq('user_id', user!.id)
            .eq('exercise_id', row.exercise_id)
            .eq('record_type', 'est_1rm')
            .lt('achieved_at', row.achieved_at)
            .order('value', { ascending: false })
            .limit(1)
            .maybeSingle();

          const previousEst1rm =
            previous.error || !previous.data ? null : previous.data.value;
          const workoutExerciseId = row.set?.workout_exercise_id;
          const setCount = workoutExerciseId
            ? (setCounts.get(workoutExerciseId) ?? 0)
            : 0;

          return mapRecentPRRow(row, unit, previousEst1rm, setCount);
        }),
      );

      return mapped;
    },
  });
}
