import { z } from 'zod';

import { usernameSchema, profileUsernameSchema } from '@/lib/auth/username';
import {
  EQUIPMENT_TYPES,
  EXERCISE_TYPES,
  MUSCLE_GROUPS,
  RECORD_TYPES,
  UNIT_PREFERENCES,
  WORKOUT_STATUSES,
} from '@/lib/constants/training';

export const createExerciseSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  muscle_group: z.enum(MUSCLE_GROUPS),
  equipment: z.enum(EQUIPMENT_TYPES).optional().nullable(),
  exercise_type: z.enum(EXERCISE_TYPES).optional().nullable(),
  instructions: z.string().trim().max(2000).optional().nullable(),
});

export const createRoutineSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  description: z.string().trim().max(500).optional().nullable(),
});

export const routineExerciseSchema = z.object({
  exercise_id: z.string().uuid(),
  order_index: z.number().int().min(0),
  target_sets: z.number().int().min(1).max(20).optional().nullable(),
  target_reps: z.number().int().min(1).max(100).optional().nullable(),
  target_weight: z.number().min(0).max(2000).optional().nullable(),
});

export const createWorkoutSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  routine_id: z.string().uuid().optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const updateWorkoutSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  status: z.enum(WORKOUT_STATUSES).optional(),
  completed_at: z.string().datetime().optional().nullable(),
  duration_seconds: z.number().int().min(0).optional().nullable(),
  total_volume: z.number().min(0).optional(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const createSetSchema = z.object({
  workout_exercise_id: z.string().uuid(),
  set_number: z.number().int().min(1).max(50),
  weight: z.number().min(0).max(2000).optional().nullable(),
  reps: z.number().int().min(0).max(500).optional().nullable(),
  rpe: z.number().min(1).max(10).optional().nullable(),
  is_warmup: z.boolean().optional(),
  is_pr: z.boolean().optional(),
  completed_at: z.string().datetime().optional().nullable(),
});

export const updateSetSchema = createSetSchema
  .partial()
  .omit({ workout_exercise_id: true, set_number: true });

export const updateProfileSchema = z.object({
  display_name: z.string().trim().min(1).max(50).optional(),
  username: profileUsernameSchema.optional(),
  unit_preference: z.enum(UNIT_PREFERENCES).optional(),
  avatar_url: z.union([z.string().url(), z.null()]).optional(),
});

export const createBodyMetricSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
  weight: z.number().min(20).max(500).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const createPersonalRecordSchema = z.object({
  exercise_id: z.string().uuid(),
  record_type: z.enum(RECORD_TYPES),
  value: z.number().min(0),
  achieved_at: z.string().datetime().optional(),
  set_id: z.string().uuid().optional().nullable(),
});

export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
export type CreateRoutineInput = z.infer<typeof createRoutineSchema>;
export type RoutineExerciseInput = z.infer<typeof routineExerciseSchema>;
export type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;
export type UpdateWorkoutInput = z.infer<typeof updateWorkoutSchema>;
export type CreateSetInput = z.infer<typeof createSetSchema>;
export type UpdateSetInput = z.infer<typeof updateSetSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateBodyMetricInput = z.infer<typeof createBodyMetricSchema>;
export type CreatePersonalRecordInput = z.infer<typeof createPersonalRecordSchema>;
