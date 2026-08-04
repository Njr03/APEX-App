import type { RecordType } from '@/lib/constants/training';
import type { PersonalRecord } from '@/lib/supabase';

/** Epley formula — estimated 1-rep max from weight × reps. */
export function estimateOneRepMax(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export function calculateSetVolume(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  return weight * reps;
}

export interface BrokenRecord {
  record_type: RecordType;
  value: number;
  previousBest: number | null;
}

export interface PersonalRecordCheckResult {
  isPR: boolean;
  brokenRecords: BrokenRecord[];
}

/**
 * Compares a completed set against stored PRs for an exercise.
 * Skips warmup sets. Checks max_weight, max_reps, max_volume (single set), est_1rm.
 */
export function checkForPersonalRecords(
  weight: number,
  reps: number,
  existingRecords: PersonalRecord[],
  isWarmup: boolean,
): PersonalRecordCheckResult {
  if (isWarmup || weight <= 0 || reps <= 0) {
    return { isPR: false, brokenRecords: [] };
  }

  const byType = new Map<RecordType, number>();
  for (const record of existingRecords) {
    byType.set(record.record_type, record.value);
  }

  const candidates: Array<{ record_type: RecordType; value: number }> = [
    { record_type: 'max_weight', value: weight },
    { record_type: 'max_reps', value: reps },
    { record_type: 'max_volume', value: calculateSetVolume(weight, reps) },
    { record_type: 'est_1rm', value: estimateOneRepMax(weight, reps) },
  ];

  const brokenRecords: BrokenRecord[] = [];

  for (const candidate of candidates) {
    const previousBest = byType.get(candidate.record_type) ?? null;
    const beatsRecord =
      previousBest === null || candidate.value > previousBest;

    if (beatsRecord) {
      brokenRecords.push({
        record_type: candidate.record_type,
        value: candidate.value,
        previousBest,
      });
    }
  }

  return {
    isPR: brokenRecords.length > 0,
    brokenRecords,
  };
}

export function formatRecordValue(
  recordType: RecordType,
  value: number,
  unit: 'kg' | 'lb' = 'kg',
): string {
  switch (recordType) {
    case 'max_reps':
      return `${Math.round(value)} reps`;
    case 'est_1rm':
    case 'max_weight':
    case 'max_volume':
      return `${value.toFixed(1)} ${unit}`;
    default:
      return value.toFixed(1);
  }
}

export function formatRecordTypeLabel(recordType: RecordType): string {
  switch (recordType) {
    case 'max_weight':
      return 'Max weight';
    case 'max_reps':
      return 'Max reps';
    case 'max_volume':
      return 'Max volume';
    case 'est_1rm':
      return 'Estimated 1RM';
  }
}
