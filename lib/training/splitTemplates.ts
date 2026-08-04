import type { TrainingSplit } from '@/lib/training/splits';

export interface SplitTemplateExercise {
  exerciseName: string;
  exerciseId?: string;
  sets: number;
  reps: number;
  weightKg: number;
}

export interface SplitWorkoutPlan {
  split: TrainingSplit;
  exercises: SplitTemplateExercise[];
}

export const SPLIT_TEMPLATES: Record<TrainingSplit, SplitTemplateExercise[]> = {
  A: [
    { exerciseName: 'Barbell Bench Press', sets: 4, reps: 8, weightKg: 80 },
    { exerciseName: 'Incline Dumbbell Press', sets: 3, reps: 10, weightKg: 30 },
    { exerciseName: 'Cable Fly', sets: 3, reps: 12, weightKg: 15 },
    { exerciseName: 'Barbell Bicep Curl', sets: 3, reps: 10, weightKg: 30 },
    { exerciseName: 'Cable Tricep Pushdown', sets: 3, reps: 12, weightKg: 25 },
  ],
  B: [
    { exerciseName: 'Conventional Deadlift', sets: 4, reps: 5, weightKg: 120 },
    { exerciseName: 'Barbell Row', sets: 4, reps: 8, weightKg: 70 },
    { exerciseName: 'Lat Pulldown', sets: 3, reps: 10, weightKg: 55 },
    { exerciseName: 'Overhead Press', sets: 3, reps: 8, weightKg: 50 },
    { exerciseName: 'Lateral Raise', sets: 3, reps: 12, weightKg: 12 },
  ],
  L: [
    { exerciseName: 'Back Squat', sets: 4, reps: 6, weightKg: 100 },
    { exerciseName: 'Romanian Deadlift', sets: 3, reps: 8, weightKg: 80 },
    { exerciseName: 'Leg Press', sets: 3, reps: 12, weightKg: 150 },
    { exerciseName: 'Leg Curl', sets: 3, reps: 12, weightKg: 40 },
    { exerciseName: 'Standing Calf Raise', sets: 4, reps: 15, weightKg: 60 },
  ],
};

export function getSplitTemplate(split: TrainingSplit): SplitWorkoutPlan {
  return {
    split,
    exercises: SPLIT_TEMPLATES[split].map((exercise) => ({ ...exercise })),
  };
}
