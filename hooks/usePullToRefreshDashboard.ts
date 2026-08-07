import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { invalidateDashboardMetrics } from '@/hooks/queries/workoutCache';
import { useAuth } from '@/providers/AuthProvider';

export function usePullToRefreshDashboard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    if (!user) return;

    setRefreshing(true);

    try {
      await invalidateDashboardMetrics(queryClient, user.id);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, user]);

  return { onRefresh, refreshing };
}
