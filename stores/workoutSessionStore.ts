import { create } from 'zustand';

import type { TrainingSplit } from '@/lib/training/splits';

interface ExerciseTargets {
  targetSets?: number | null;
  targetReps?: number | null;
  targetWeight?: number | null;
}

interface WorkoutSessionState {
  restDurationSeconds: number;
  restEndsAt: number | null;
  restTotalSeconds: number;
  expandedExerciseIds: Set<string>;
  exerciseTargets: Record<string, ExerciseTargets>;
  workoutStartTime: string | null;
  activeSplit: TrainingSplit | null;
  isWorkoutPaused: boolean;
  pausedAt: number | null;
  accumulatedPauseMs: number;

  setRestDurationSeconds: (seconds: number) => void;
  startRestTimer: (seconds?: number) => void;
  clearRestTimer: () => void;
  initSession: (split: TrainingSplit | null, startTime: string) => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  toggleExerciseExpanded: (workoutExerciseId: string) => void;
  setExerciseExpanded: (workoutExerciseId: string, expanded: boolean) => void;
  setExerciseTargets: (
    workoutExerciseId: string,
    targets: ExerciseTargets,
  ) => void;
  resetSession: () => void;
}

const DEFAULT_REST_SECONDS = 90;

export const useWorkoutSessionStore = create<WorkoutSessionState>(
  (set, get) => ({
    restDurationSeconds: DEFAULT_REST_SECONDS,
    restEndsAt: null,
    restTotalSeconds: DEFAULT_REST_SECONDS,
    expandedExerciseIds: new Set<string>(),
    exerciseTargets: {},
    workoutStartTime: null,
    activeSplit: null,
    isWorkoutPaused: false,
    pausedAt: null,
    accumulatedPauseMs: 0,

    setRestDurationSeconds: (seconds) =>
      set({ restDurationSeconds: Math.max(15, seconds) }),

    startRestTimer: (seconds) => {
      const duration = seconds ?? get().restDurationSeconds;
      set({
        restEndsAt: Date.now() + duration * 1000,
        restTotalSeconds: duration,
      });
    },

    clearRestTimer: () => set({ restEndsAt: null, restTotalSeconds: 0 }),

    initSession: (split, startTime) =>
      set({
        activeSplit: split,
        workoutStartTime: startTime,
        isWorkoutPaused: false,
        pausedAt: null,
        accumulatedPauseMs: 0,
      }),

    pauseWorkout: () =>
      set((state) =>
        state.isWorkoutPaused
          ? state
          : { isWorkoutPaused: true, pausedAt: Date.now() },
      ),

    resumeWorkout: () =>
      set((state) => {
        if (!state.isWorkoutPaused || state.pausedAt == null) {
          return { isWorkoutPaused: false, pausedAt: null };
        }

        return {
          isWorkoutPaused: false,
          pausedAt: null,
          accumulatedPauseMs:
            state.accumulatedPauseMs + (Date.now() - state.pausedAt),
        };
      }),

    toggleExerciseExpanded: (workoutExerciseId) =>
      set((state) => {
        const next = new Set(state.expandedExerciseIds);
        if (next.has(workoutExerciseId)) {
          next.delete(workoutExerciseId);
        } else {
          next.add(workoutExerciseId);
        }
        return { expandedExerciseIds: next };
      }),

    setExerciseExpanded: (workoutExerciseId, expanded) =>
      set((state) => {
        const next = new Set(state.expandedExerciseIds);
        if (expanded) {
          next.add(workoutExerciseId);
        } else {
          next.delete(workoutExerciseId);
        }
        return { expandedExerciseIds: next };
      }),

    setExerciseTargets: (workoutExerciseId, targets) =>
      set((state) => ({
        exerciseTargets: {
          ...state.exerciseTargets,
          [workoutExerciseId]: targets,
        },
      })),

    resetSession: () =>
      set({
        restEndsAt: null,
        restTotalSeconds: DEFAULT_REST_SECONDS,
        expandedExerciseIds: new Set<string>(),
        exerciseTargets: {},
        workoutStartTime: null,
        activeSplit: null,
        isWorkoutPaused: false,
        pausedAt: null,
        accumulatedPauseMs: 0,
      }),
  }),
);
