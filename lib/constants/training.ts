export const MUSCLE_GROUPS = [
  'chest',
  'back',
  'legs',
  'shoulders',
  'arms',
  'core',
  'full_body',
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const EQUIPMENT_TYPES = [
  'barbell',
  'dumbbell',
  'machine',
  'cable',
  'bodyweight',
  'other',
] as const;

export type EquipmentType = (typeof EQUIPMENT_TYPES)[number];

export const EXERCISE_TYPES = ['compound', 'isolation'] as const;

export type ExerciseType = (typeof EXERCISE_TYPES)[number];

export const WORKOUT_STATUSES = ['in_progress', 'completed'] as const;

export type WorkoutStatus = (typeof WORKOUT_STATUSES)[number];

export const RECORD_TYPES = [
  'max_weight',
  'max_reps',
  'max_volume',
  'est_1rm',
] as const;

export type RecordType = (typeof RECORD_TYPES)[number];

export const UNIT_PREFERENCES = ['kg', 'lb'] as const;

export type UnitPreference = (typeof UNIT_PREFERENCES)[number];
