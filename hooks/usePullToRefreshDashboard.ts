import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { invalidateDashboardMetrics } from '@/hooks/queries/workoutCache';
import { useAuth } from '@/providers/AuthProvider';

export function usePullToRefreshDashboard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    if (!user || refreshing) return;

    setRefreshing(true);
    const startedAt = Date.now();

    try {
      await invalidateDashboardMetrics(queryClient, user.id);
    } finally {
      const elapsed = Date.now() - startedAt;
      if (elapsed < 450) {
        await new Promise((resolve) => setTimeout(resolve, 450 - elapsed));
      }
      setRefreshing(false);
    }
  }, [queryClient, refreshing, user]);

  return { onRefresh, refreshing };
}
