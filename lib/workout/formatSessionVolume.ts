import { kgToDisplay, volumeLabel, weightUnitLabel } from '@/lib/units';

/** Formats sets, reps, then weight: "4 sets · 8 reps · 176lbs" */
export function formatExerciseScheme(
  sets: number,
  reps: number | null | undefined,
  weightKg: number | null | undefined,
  unit: 'kg' | 'lb',
): string {
  const parts: string[] = [`${sets} sets`];

  if (reps != null && reps > 0) {
    parts.push(`${reps} reps`);
  }

  if (weightKg != null && weightKg > 0) {
    parts.push(`${kgToDisplay(weightKg, 'lb')}${weightUnitLabel('lb')}`);
  }

  return parts.join(' · ');
}

export function summarizeLoggedExerciseSets(
  sets: Array<{
    weight: number | null;
    reps: number | null;
    completed_at: string | null;
    is_warmup: boolean;
  }>,
  unit: 'kg' | 'lb',
): string | null {
  const completed = sets.filter((set) => set.completed_at && !set.is_warmup);
  if (completed.length === 0) return null;

  const topSet = completed.reduce<(typeof completed)[0] | null>((best, set) => {
    if (!best) return set;

    const volume = (set.weight ?? 0) * (set.reps ?? 0);
    const bestVolume = (best.weight ?? 0) * (best.reps ?? 0);
    return volume > bestVolume ? set : best;
  }, null);

  if (!topSet) return `${completed.length} sets`;

  return formatExerciseScheme(
    completed.length,
    topSet.reps,
    topSet.weight,
    unit,
  );
}

/** Formats live session volume: "1,234 kg" or "1.2k kg" for large values. */
export function formatSessionVolume(
  volumeKg: number,
  unit: 'kg' | 'lb' = 'lb',
): string {
  const raw = unit === 'lb' ? volumeKg * 2.20462 : volumeKg;
  const label = volumeLabel(unit);

  if (raw >= 1000) {
    return `${(raw / 1000).toFixed(1)}k ${label}`;
  }

  return `${Math.round(raw).toLocaleString('en-US')} ${label}`;
}

export function formatTargetScheme(
  weightKg: number | null | undefined,
  sets: number | null | undefined,
  reps: number | null | undefined,
  unit: 'kg' | 'lb',
): string | null {
  if (weightKg == null && sets == null && reps == null) return null;

  const parts: string[] = [];
  if (weightKg != null) {
    parts.push(`${kgToDisplay(weightKg, unit)}${weightUnitLabel(unit)}`);
  }
  if (sets != null && reps != null) {
    parts.push(`${sets}×${reps}`);
  }

  return parts.length > 0 ? parts.join(' · ') : null;
}
