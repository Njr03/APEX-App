import { kgToDisplay, volumeLabel, weightUnitLabel } from '@/lib/units';

const SCHEME_SEPARATOR = ' · ';

function formatWeightPart(
  weightKg: number | null | undefined,
  unit: 'kg' | 'lb',
): string {
  if (weightKg == null || weightKg <= 0) return '—';
  return `${kgToDisplay(weightKg, unit)} ${weightUnitLabel(unit)}`;
}

function formatCountPart(value: number | null | undefined): string {
  if (value == null || value <= 0) return '—';
  return String(value);
}

/** Canonical logged-workout scheme: sets · reps · weight (e.g. "3 · 8 · 135 lb"). */
export function formatSetRepsWeight(
  sets: number | null | undefined,
  reps: number | null | undefined,
  weightKg: number | null | undefined,
  unit: 'kg' | 'lb',
): string {
  return [
    formatCountPart(sets),
    formatCountPart(reps),
    formatWeightPart(weightKg, unit),
  ].join(SCHEME_SEPARATOR);
}

/** Formats a single logged set row: "Set 1: 1 · 8 · 135 lb". */
export function formatLoggedSetLine(
  setNumber: number,
  reps: number | null | undefined,
  weightKg: number | null | undefined,
  unit: 'kg' | 'lb',
  options?: { isPr?: boolean },
): string {
  const suffix = options?.isPr ? ' 🏆' : '';
  return `Set ${setNumber}: ${formatSetRepsWeight(1, reps, weightKg, unit)}${suffix}`;
}

/** Formats sets, reps, then weight for exercise targets and summaries. */
export function formatExerciseScheme(
  sets: number,
  reps: number | null | undefined,
  weightKg: number | null | undefined,
  unit: 'kg' | 'lb',
): string {
  return formatSetRepsWeight(sets, reps, weightKg, unit);
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

  if (!topSet) {
    return formatSetRepsWeight(completed.length, null, null, unit);
  }

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
  sets: number | null | undefined,
  reps: number | null | undefined,
  weightKg: number | null | undefined,
  unit: 'kg' | 'lb',
): string | null {
  if (weightKg == null && sets == null && reps == null) return null;

  const formatted = formatSetRepsWeight(sets, reps, weightKg, unit);
  if (formatted === '— · — · —') return null;

  return formatted;
}
