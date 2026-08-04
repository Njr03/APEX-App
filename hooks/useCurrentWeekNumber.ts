import { useMemo } from 'react';

import { useProfile } from '@/hooks/queries/useProfile';
import { getCurrentWeekNumber } from '@/lib/training/weekNumber';

export function useCurrentWeekNumber() {
  const { data: profile, isLoading } = useProfile();

  const weekNumber = useMemo(() => {
    if (!profile?.created_at) return 1;
    return getCurrentWeekNumber(profile.created_at);
  }, [profile?.created_at]);

  return { weekNumber, isLoading };
}
