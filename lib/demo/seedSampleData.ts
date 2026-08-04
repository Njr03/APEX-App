import {
  addDays,
  endOfWeek,
  setHours,
  setMinutes,
  startOfWeek,
  subWeeks,
} from 'date-fns';

import { throwIfSupabaseError } from '@/lib/supabase/errors';
import { supabase } from '@/lib/supabase';
import { calculateWorkoutVolume } from '@/lib/workout/volume';
import { estimateOneRepMax } from '@/lib/personalRecords';
import {
  getSplitWorkoutName,
  type TrainingSplit,
} from '@/lib/training/splits';
import { SPLIT_TEMPLATES } from '@/lib/training/splitTemplates';

const WEEKLY_SPLIT_PATTERNS: Record<number, TrainingSplit[]> = {
  7: ['A', 'B', 'L'],
  6: ['A', 'B', 'L'],
  5: ['A', 'B', 'L'],
  4: ['A', 'B', 'L'],
  3: ['A', 'B', 'L'],
  2: ['A', 'B'],
  1: ['A', 'L'],
  0: ['A'],
};

const VOLUME_MULTIPLIERS: Partial<Record<TrainingSplit, number>> = {
  A: 0.95,
  B: 0.75,
  L: 1.05,
};

async function fetchExerciseMap(): Promise<Map<string, string>> {
  const result = await supabase.from('exercises').select('id, name');
  const rows = throwIfSupabaseError(result);
  return new Map(rows.map((row) => [row.name, row.id]));
}

function workoutTimestamp(referenceDate: Date, weeksAgo: number, dayOffset: number): Date {
  const weekStart = startOfWeek(subWeeks(referenceDate, weeksAgo), { weekStartsOn: 1 });
  return setMinutes(setHours(addDays(weekStart, dayOffset), 10 + dayOffset), 30);
}

export async function seedSampleData(userId: string): Promise<number> {
  const existing = await supabase
    .from('workouts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'completed');

  if ((existing.count ?? 0) > 0) {
    return 0;
  }

  const exerciseMap = await fetchExerciseMap();
  const referenceDate = new Date();
  let created = 0;
  const prCandidates: Array<{
    exerciseId: string;
    setId: string;
    weight: number;
    reps: number;
    achievedAt: string;
  }> = [];

  for (const [weeksAgoString, splits] of Object.entries(WEEKLY_SPLIT_PATTERNS)) {
    const weeksAgo = Number(weeksAgoString);

    for (const [splitIndex, split] of splits.entries()) {
      const template = SPLIT_TEMPLATES[split];
      const startedAt = workoutTimestamp(referenceDate, weeksAgo, splitIndex * 2 + 1);
      const completedAt = addDays(startedAt, 0);
      completedAt.setHours(startedAt.getHours() + 1, startedAt.getMinutes() + 15);

      const workoutResult = await supabase
        .from('workouts')
        .insert({
          user_id: userId,
          name: getSplitWorkoutName(split),
          status: 'completed',
          started_at: startedAt.toISOString(),
          completed_at: completedAt.toISOString(),
          duration_seconds: 4200 + splitIndex * 300,
          total_volume: 0,
        })
        .select('id')
        .single();

      const workout = throwIfSupabaseError(workoutResult);
      const multiplier = VOLUME_MULTIPLIERS[split] ?? 1;
      const allSets: Array<{
        weight: number;
        reps: number;
        is_warmup: boolean;
        completed_at: string;
      }> = [];

      for (const [orderIndex, planned] of template.entries()) {
        const exerciseId = exerciseMap.get(planned.exerciseName);
        if (!exerciseId) continue;

        const workoutExerciseResult = await supabase
          .from('workout_exercises')
          .insert({
            workout_id: workout.id,
            exercise_id: exerciseId,
            order_index: orderIndex,
          })
          .select('id')
          .single();

        const workoutExercise = throwIfSupabaseError(workoutExerciseResult);
        const adjustedWeight = Math.round(planned.weightKg * multiplier * 10) / 10;

        for (let setNumber = 1; setNumber <= planned.sets; setNumber += 1) {
          const setResult = await supabase
            .from('sets')
            .insert({
              workout_exercise_id: workoutExercise.id,
              set_number: setNumber,
              weight: adjustedWeight,
              reps: planned.reps,
              is_warmup: false,
              is_pr: orderIndex === 0 && setNumber === planned.sets,
              completed_at: completedAt.toISOString(),
            })
            .select('id, weight, reps, is_warmup, completed_at')
            .single();

          const setRow = throwIfSupabaseError(setResult);
          allSets.push({
            weight: setRow.weight ?? adjustedWeight,
            reps: setRow.reps ?? planned.reps,
            is_warmup: false,
            completed_at: setRow.completed_at ?? completedAt.toISOString(),
          });

          if (orderIndex === 0 && setNumber === planned.sets) {
            prCandidates.push({
              exerciseId,
              setId: setRow.id,
              weight: setRow.weight ?? adjustedWeight,
              reps: setRow.reps ?? planned.reps,
              achievedAt: completedAt.toISOString(),
            });
          }
        }
      }

      const totalVolume = calculateWorkoutVolume(allSets);
      await supabase
        .from('workouts')
        .update({ total_volume: totalVolume })
        .eq('id', workout.id);

      created += 1;
    }
  }

  const recentCandidates = prCandidates.slice(-4).reverse();
  for (const [index, candidate] of recentCandidates.entries()) {
    const achievedAt = new Date(candidate.achievedAt);
    achievedAt.setMinutes(achievedAt.getMinutes() + index);

    await supabase.from('personal_records').upsert(
      [
        {
          user_id: userId,
          exercise_id: candidate.exerciseId,
          record_type: 'max_weight',
          value: candidate.weight + index * 2.5,
          achieved_at: achievedAt.toISOString(),
          set_id: candidate.setId,
        },
        {
          user_id: userId,
          exercise_id: candidate.exerciseId,
          record_type: 'est_1rm',
          value: estimateOneRepMax(
            candidate.weight + index * 2.5,
            candidate.reps,
          ),
          achieved_at: achievedAt.toISOString(),
          set_id: candidate.setId,
        },
      ],
      { onConflict: 'user_id,exercise_id,record_type' },
    );
  }

  return created;
}

export function sampleDataWindowStart(referenceDate = new Date()): string {
  return startOfWeek(subWeeks(referenceDate, 7), { weekStartsOn: 1 }).toISOString();
}

export function sampleDataWindowEnd(referenceDate = new Date()): string {
  return endOfWeek(referenceDate, { weekStartsOn: 1 }).toISOString();
}
