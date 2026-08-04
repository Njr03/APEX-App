import { useEffect, useRef } from 'react';

import { useSeedSampleData } from '@/hooks/useSeedSampleData';
import { useWorkouts } from '@/hooks/queries';

export function useAutoSeedDemoData() {
  const { data: workouts, isLoading } = useWorkouts({ status: 'completed', limit: 1 });
  const { mutate, isPending, isSuccess } = useSeedSampleData();
  const hasRequestedRef = useRef(false);

  useEffect(() => {
    if (isLoading || isPending || isSuccess || hasRequestedRef.current) return;
    if ((workouts?.length ?? 0) > 0) return;

    hasRequestedRef.current = true;
    mutate();
  }, [isLoading, isPending, isSuccess, mutate, workouts?.length]);
}
