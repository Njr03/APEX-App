import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

import {
  clearActiveWorkoutCache,
  invalidateDashboardMetrics,
} from '@/hooks/queries/workoutCache';
import { calculateStreakUpdate, calculateLongestStreak } from '@/lib/streak';
import {
  assertSupabaseOk,
  throwIfSupabaseError,
  unwrapSupabaseNullable,
} from '@/lib/supabase/errors';
import { supabase, type WorkoutWithDetails } from '@/lib/supabase';
import { calculateWorkoutXP } from '@/lib/xp';
import { didHitRoutineTargets } from '@/lib/workout/routineTarget';
import {
  finalizeWorkoutSets,
  resolveWorkoutNameForSplitTracking,
} from '@/lib/workout/finalizeWorkoutSession';
import {
  calculateWorkoutVolume,
  collectWorkoutSets,
  countWorkoutPRSets,
} from '@/lib/workout/volume';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkoutSessionStore } from '@/stores/workoutSessionStore';

export interface FinishWorkoutResult {
  workoutId: string;
  totalVolume: number;
  durationSeconds: number;
  prCount: number;
  xpEarned: number;
  newStreak: number;
  hitRoutineTarget: boolean;
}

export function useFinishWorkout() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workout,
    }: {
      workout: WorkoutWithDetails;
    }): Promise<FinishWorkoutResult> => {
      if (!user) throw new Error('Not authenticated');

      const completedAt = new Date();
      const finalizedWorkout = await finalizeWorkoutSets(workout, completedAt);
      const activeSplit = useWorkoutSessionStore.getState().activeSplit;
      const trackedName = resolveWorkoutNameForSplitTracking(
        workout.name,
        activeSplit,
      );

      const prCount = countWorkoutPRSets(finalizedWorkout.workout_exercises);

      const startedAt = new Date(workout.started_at);
      const durationSeconds = Math.max(
        0,
        Math.floor((completedAt.getTime() - startedAt.getTime()) / 1000),
      );

      const allSets = collectWorkoutSets(finalizedWorkout.workout_exercises);
      const totalVolume = calculateWorkoutVolume(allSets);

      let hitRoutineTarget = false;

      if (workout.routine_id) {
        const routineResult = await supabase
          .from('routines')
          .select(
            `
            *,
            routine_exercises (*)
          `,
          )
          .eq('id', workout.routine_id)
          .single();

        const routine = throwIfSupabaseError(routineResult);

        hitRoutineTarget = didHitRoutineTargets(finalizedWorkout, {
          ...routine,
          routine_exercises: [...(routine.routine_exercises ?? [])].sort(
            (a, b) => a.order_index - b.order_index,
          ),
        });
      }

      const xpEarned = calculateWorkoutXP({ prCount, hitRoutineTarget });

      const profileResult = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const profile = throwIfSupabaseError(profileResult);

      const lastWorkoutResult = await supabase
        .from('workouts')
        .select('completed_at')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const lastCompleted = unwrapSupabaseNullable(lastWorkoutResult);

      const newStreak = calculateStreakUpdate(
        profile.current_streak,
        lastCompleted?.completed_at ?? null,
        completedAt,
      );

      const workoutUpdate = await supabase
        .from('workouts')
        .update({
          name: trackedName,
          status: 'completed',
          completed_at: completedAt.toISOString(),
          duration_seconds: durationSeconds,
          total_volume: totalVolume,
        })
        .eq('id', workout.id)
        .select('*')
        .single();

      throwIfSupabaseError(workoutUpdate);

      const cleanupResult = await supabase
        .from('workouts')
        .delete()
        .eq('user_id', user.id)
        .eq('status', 'in_progress');

      assertSupabaseOk(cleanupResult);

      const profileUpdate = await supabase
        .from('profiles')
        .update({
          current_streak: newStreak,
          longest_streak: calculateLongestStreak(
            profile.longest_streak,
            newStreak,
          ),
          total_xp: profile.total_xp + xpEarned,
        })
        .eq('id', user.id)
        .select('*')
        .single();

      throwIfSupabaseError(profileUpdate);

      return {
        workoutId: workout.id,
        totalVolume,
        durationSeconds,
        prCount,
        xpEarned,
        newStreak,
        hitRoutineTarget,
      };
    },
    onSuccess: () => {
      if (user) {
        clearActiveWorkoutCache(queryClient, user.id);
      }
      void invalidateDashboardMetrics(queryClient, user?.id);
    },
  });
}

export function defaultWorkoutName(date = new Date()): string {
  return `Workout · ${format(date, 'MMM d')}`;
}
