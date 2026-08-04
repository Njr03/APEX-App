import { useEffect, useRef, useState } from 'react';

import { useActiveWorkout, useCreateWorkout } from '@/hooks/queries/useWorkouts';
import { defaultWorkoutName } from '@/hooks/useFinishWorkout';
import { inferSplitFromWorkoutName } from '@/lib/training/splits';
import { useWorkoutSessionStore } from '@/stores/workoutSessionStore';

/**
 * Keeps the active workout screen in sync with the active-workout query.
 * Planned sessions are populated before navigation via useStartWorkoutSession.
 */
export function useBootstrapActiveWorkout() {
  const {
    data: activeWorkout,
    isLoading,
    isError,
    error,
    refetch,
  } = useActiveWorkout();
  const createWorkout = useCreateWorkout();
  const initSession = useWorkoutSessionStore((s) => s.initSession);
  const setExerciseExpanded = useWorkoutSessionStore(
    (s) => s.setExerciseExpanded,
  );

  const [isCreatingEmptySession, setIsCreatingEmptySession] = useState(false);
  const [createError, setCreateError] = useState<Error | null>(null);
  const hasInitializedRef = useRef<string | null>(null);
  const emptySessionStartedRef = useRef(false);

  const activeWorkoutId = activeWorkout?.id ?? null;
  const hasExercises = (activeWorkout?.workout_exercises.length ?? 0) > 0;

  useEffect(() => {
    if (!activeWorkoutId || !activeWorkout) return;
    if (hasInitializedRef.current === activeWorkoutId) return;

    hasInitializedRef.current = activeWorkoutId;

    if (hasExercises) {
      activeWorkout.workout_exercises.forEach((we, index) => {
        setExerciseExpanded(we.id, index === 0);
      });
    }

    initSession(
      inferSplitFromWorkoutName(activeWorkout.name),
      activeWorkout.started_at,
    );
  }, [
    activeWorkout,
    activeWorkoutId,
    hasExercises,
    initSession,
    setExerciseExpanded,
  ]);

  useEffect(() => {
    if (isLoading || emptySessionStartedRef.current || activeWorkoutId) return;

    emptySessionStartedRef.current = true;
    let cancelled = false;

    const createEmptySession = async () => {
      setIsCreatingEmptySession(true);
      setCreateError(null);

      try {
        await createWorkout.mutateAsync({ name: defaultWorkoutName() });
        if (!cancelled) {
          await refetch();
        }
      } catch (err) {
        if (!cancelled) {
          emptySessionStartedRef.current = false;
          setCreateError(
            err instanceof Error ? err : new Error('Failed to start workout'),
          );
        }
      } finally {
        if (!cancelled) {
          setIsCreatingEmptySession(false);
        }
      }
    };

    void createEmptySession();

    return () => {
      cancelled = true;
    };
  }, [activeWorkoutId, createWorkout, isLoading, refetch]);

  const retry = () => {
    emptySessionStartedRef.current = false;
    setCreateError(null);
    void refetch();
  };

  return {
    workout: activeWorkout,
    isLoading: isLoading || isCreatingEmptySession,
    isError: isError || Boolean(createError),
    error: createError ?? error,
    refetch,
    retry,
  };
}
