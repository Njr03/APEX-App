import { useEffect, useState } from 'react';

import { useWorkoutSessionStore } from '@/stores/workoutSessionStore';

export function formatElapsedDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function calculateElapsedSeconds(
  startedAt: string,
  accumulatedPauseMs: number,
  isPaused: boolean,
  pausedAt: number | null,
): number {
  const startMs = new Date(startedAt).getTime();
  let pauseMs = accumulatedPauseMs;

  if (isPaused && pausedAt != null) {
    pauseMs += Date.now() - pausedAt;
  }

  return Math.max(0, Math.floor((Date.now() - startMs - pauseMs) / 1000));
}

export function useWorkoutTimer(startedAt: string | undefined): number {
  const isWorkoutPaused = useWorkoutSessionStore((s) => s.isWorkoutPaused);
  const accumulatedPauseMs = useWorkoutSessionStore((s) => s.accumulatedPauseMs);
  const pausedAt = useWorkoutSessionStore((s) => s.pausedAt);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!startedAt) {
      setElapsedSeconds(0);
      return;
    }

    const tick = () => {
      setElapsedSeconds(
        calculateElapsedSeconds(
          startedAt,
          accumulatedPauseMs,
          isWorkoutPaused,
          pausedAt,
        ),
      );
    };

    tick();

    if (isWorkoutPaused) {
      return;
    }

    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [accumulatedPauseMs, isWorkoutPaused, pausedAt, startedAt]);

  return elapsedSeconds;
}

export function useCountdown(endsAt: number | null): number {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!endsAt) {
      setRemaining(0);
      return;
    }

    const tick = () => {
      setRemaining(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    };

    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [endsAt]);

  return remaining;
}
