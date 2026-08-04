import type { EquipmentType, MuscleGroup } from '@/lib/constants/training';

export const queryKeys = {
  profile: {
    all: ['profile'] as const,
    detail: (userId: string) => ['profile', userId] as const,
  },
  exercises: {
    all: ['exercises'] as const,
    lists: () => ['exercises', 'list'] as const,
    list: (filters: ExerciseListFilters = {}) =>
      ['exercises', 'list', filters] as const,
    detail: (id: string) => ['exercises', 'detail', id] as const,
  },
  routines: {
    all: ['routines'] as const,
    lists: () => ['routines', 'list'] as const,
    list: (userId: string) => ['routines', 'list', userId] as const,
    detail: (id: string) => ['routines', 'detail', id] as const,
  },
  workouts: {
    all: ['workouts'] as const,
    lists: () => ['workouts', 'list'] as const,
    list: (filters: WorkoutListFilters = {}) =>
      ['workouts', 'list', filters] as const,
    detail: (id: string) => ['workouts', 'detail', id] as const,
    active: (userId: string) => ['workouts', 'active', userId] as const,
  },
  sets: {
    all: ['sets'] as const,
    byWorkoutExercise: (workoutExerciseId: string) =>
      ['sets', 'workoutExercise', workoutExerciseId] as const,
    byWorkout: (workoutId: string) => ['sets', 'workout', workoutId] as const,
  },
  personalRecords: {
    all: ['personalRecords'] as const,
    lists: () => ['personalRecords', 'list'] as const,
    list: (filters: PersonalRecordListFilters = {}) =>
      ['personalRecords', 'list', filters] as const,
    byExercise: (exerciseId: string) =>
      ['personalRecords', 'exercise', exerciseId] as const,
  },
  bodyMetrics: {
    all: ['bodyMetrics'] as const,
    lists: () => ['bodyMetrics', 'list'] as const,
    list: (userId: string) => ['bodyMetrics', 'list', userId] as const,
  },
} as const;

export interface ExerciseListFilters {
  search?: string;
  muscleGroup?: MuscleGroup;
  equipment?: EquipmentType;
  customOnly?: boolean;
}

export interface WorkoutListFilters {
  userId?: string;
  status?: 'in_progress' | 'completed';
  limit?: number;
  from?: string;
  to?: string;
}

export interface PersonalRecordListFilters {
  userId?: string;
  exerciseId?: string;
  limit?: number;
}
