/** Epley formula — estimated 1-rep max from weight × reps. */
export function estimateOneRepMax(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export function roundToHalfKg(value: number): number {
  return Math.round(value * 2) / 2;
}

export interface SetForOneRm {
  weight: number | null;
  reps: number | null;
  is_warmup: boolean;
}

/** Best Epley 1RM from sets with reps 1–10 (excludes warmups). */
export function computeBestEstimatedOneRm(sets: SetForOneRm[]): number {
  let best = 0;

  for (const set of sets) {
    if (set.is_warmup) continue;
    const weight = set.weight ?? 0;
    const reps = set.reps ?? 0;
    if (weight <= 0 || reps < 1 || reps > 10) continue;

    best = Math.max(best, estimateOneRepMax(weight, reps));
  }

  return roundToHalfKg(best);
}
