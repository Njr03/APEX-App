import { create } from 'zustand';

import type { SplitWorkoutPlan } from '@/lib/training/splitTemplates';
import type { TrainingSplit } from '@/lib/training/splits';

interface WorkoutPlanState {
  pendingPlan: SplitWorkoutPlan | null;
  pendingSplit: TrainingSplit | null;
  setPendingPlan: (plan: SplitWorkoutPlan) => void;
  clearPendingPlan: () => void;
}

export const useWorkoutPlanStore = create<WorkoutPlanState>((set) => ({
  pendingPlan: null,
  pendingSplit: null,
  setPendingPlan: (plan) =>
    set({ pendingPlan: plan, pendingSplit: plan.split }),
  clearPendingPlan: () => set({ pendingPlan: null, pendingSplit: null }),
}));
