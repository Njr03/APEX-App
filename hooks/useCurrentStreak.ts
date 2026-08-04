import { useProfile } from '@/hooks/queries/useProfile';

export function useCurrentStreak() {
  const { data: profile, isLoading, isError, error } = useProfile();

  return {
    streak: profile?.current_streak ?? 0,
    isLoading,
    isError,
    error,
  };
}
