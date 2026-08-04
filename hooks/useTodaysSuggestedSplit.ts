import { useMemo } from 'react';

import { useWorkouts } from '@/hooks/queries/useWorkouts';
import {
  formatSplitLabel,
  getNextSplit,
  inferSplitFromWorkoutName,
  type TrainingSplit,
} from '@/lib/training/splits';

export function useTodaysSuggestedSplit() {
  const { data: workouts, isLoading, isError, error } = useWorkouts({
    status: 'completed',
    limit: 12,
  });

  const suggestedSplit = useMemo((): TrainingSplit => {
    if (!workouts?.length) return 'A';

    for (const workout of workouts) {
      const lastSplit = inferSplitFromWorkoutName(workout.name);
      if (lastSplit) {
        return getNextSplit(lastSplit);
      }
    }

    return (['A', 'B', 'L'] as const)[workouts.length % 3]!;
  }, [workouts]);

  return {
    suggestedSplit,
    label: formatSplitLabel(suggestedSplit),
    isLoading,
    isError,
    error,
  };
}
