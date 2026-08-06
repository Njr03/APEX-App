import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { invalidateDashboardMetrics } from '@/hooks/queries/workoutCache';
import { useAuth } from '@/providers/AuthProvider';

export function useRefreshDashboardOnFocus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      void invalidateDashboardMetrics(queryClient, user.id);
    }, [queryClient, user]),
  );
}
