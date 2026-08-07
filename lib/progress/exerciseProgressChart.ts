import type {
  ExerciseHistorySet,
  ExerciseSessionSummary,
} from '@/hooks/queries/useExerciseHistory';

export interface ExerciseProgressPoint {
  session: ExerciseSessionSummary;
  prSet: ExerciseHistorySet | null;
  value: number;
  label: string;
  isPr: boolean;
}

function formatSessionLabel(date: string): string {
  return new Date(date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function pickPrSet(session: ExerciseSessionSummary): ExerciseHistorySet | null {
  return (
    session.sets.find((set) => set.is_pr && !set.is_warmup && (set.weight ?? 0) > 0) ??
    null
  );
}

export function buildExerciseProgressPoints(
  sessions: ExerciseSessionSummary[],
  maxSessions = 16,
): ExerciseProgressPoint[] {
  const sorted = [...sessions]
    .filter((session) => session.max_weight > 0)
    .sort(
      (a, b) =>
        new Date(a.workout_date).getTime() - new Date(b.workout_date).getTime(),
    )
    .slice(-maxSessions);

  return sorted.map((session, index) => {
    const prSet = pickPrSet(session);

    return {
      session,
      prSet,
      value: session.max_weight,
      label:
        index === 0 || index === sorted.length - 1
          ? formatSessionLabel(session.workout_date)
          : '',
      isPr: Boolean(prSet),
    };
  });
}
