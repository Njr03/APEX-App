import { useEffect, useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Check, ChevronDown, Trash2 } from 'lucide-react-native';

import { AppText } from '@/components/ui/AppText';
import { useExerciseHistory } from '@/hooks/queries/useExerciseHistory';
import { useCompleteSet, useUncompleteSet } from '@/hooks/useCompleteSet';
import { useCreateSet, useDeleteSet, useUpdateSet } from '@/hooks/queries';
import { colors, fonts } from '@/constants/theme';
import { displayToKg, kgToDisplay } from '@/lib/units';
import type { Exercise, Set, WorkoutExercise } from '@/lib/supabase';
import { formatTargetScheme } from '@/lib/workout/formatSessionVolume';
import { useWorkoutSessionStore } from '@/stores/workoutSessionStore';

const CARD_BG = '#141427';
const BORDER = 'rgba(255,255,255,0.06)';
const INPUT_BG = '#1b1b35';
const MUTED = 'rgba(240,237,232,0.5)';
const TABLE_HEADER = 'rgba(232,230,240,0.22)';
const LIME = '#c8ff5a';
const GOLD = '#f5c842';
const TEXT_DARK = '#08080f';

interface SetRowProps {
  set: Set;
  exercise: Exercise;
  unit: 'kg' | 'lb';
  weightPlaceholder?: string;
  repsPlaceholder?: string;
  canRemove: boolean;
  isRemoving: boolean;
  onRemove: () => void;
}

function SetRow({
  set,
  exercise,
  unit,
  weightPlaceholder,
  repsPlaceholder,
  canRemove,
  isRemoving,
  onRemove,
}: SetRowProps) {
  const isCompleted = Boolean(set.completed_at);
  const completeSet = useCompleteSet();
  const uncompleteSet = useUncompleteSet();
  const updateSet = useUpdateSet();

  const [weightText, setWeightText] = useState(
    set.weight != null ? kgToDisplay(set.weight, unit) : '',
  );
  const [repsText, setRepsText] = useState(
    set.reps != null ? String(set.reps) : '',
  );

  useEffect(() => {
    setWeightText(set.weight != null ? kgToDisplay(set.weight, unit) : '');
    setRepsText(set.reps != null ? String(set.reps) : '');
  }, [set.weight, set.reps, unit]);

  const persistDraft = async () => {
    if (isCompleted) return;

    const weightKg = displayToKg(weightText, unit);
    const reps = repsText ? parseInt(repsText, 10) : null;

    await updateSet.mutateAsync({
      id: set.id,
      workoutExerciseId: set.workout_exercise_id,
      weight: weightKg,
      reps: Number.isNaN(reps) ? null : reps,
    });
  };

  const handleToggleComplete = async () => {
    if (isCompleted) {
      await uncompleteSet.mutateAsync(set);
      return;
    }

    const weightKg = displayToKg(weightText, unit);
    const reps = parseInt(repsText, 10);

    if (weightKg == null || weightKg <= 0 || Number.isNaN(reps) || reps <= 0) {
      return;
    }

    await completeSet.mutateAsync({
      set,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      weightKg,
      reps,
      isWarmup: set.is_warmup,
      unit,
    });
  };

  const isBusy =
    completeSet.isPending ||
    uncompleteSet.isPending ||
    updateSet.isPending ||
    isRemoving;

  const inputStyle = {
    backgroundColor: INPUT_BG,
    borderColor: BORDER,
    borderRadius: 7,
    borderWidth: 1,
    color: colors.text,
    fontFamily: fonts.jetbrainsMono,
    fontSize: 13,
    paddingHorizontal: 8,
    paddingVertical: 6,
    textAlign: 'center' as const,
  };

  return (
    <View
      style={{
        alignItems: 'center',
        flexDirection: 'row',
        gap: 8,
        opacity: isCompleted ? 0.55 : 1,
      }}
    >
      <Text
        style={{
          color: MUTED,
          fontFamily: fonts.jetbrainsMono,
          fontSize: 10,
          width: 22,
        }}
      >
        {set.set_number}
      </Text>

      <View style={{ flex: 1 }}>
        <TextInput
          editable={!isCompleted}
          keyboardType="decimal-pad"
          onBlur={() => void persistDraft()}
          onChangeText={setWeightText}
          placeholder={weightPlaceholder ?? '—'}
          placeholderTextColor="rgba(240,237,232,0.35)"
          style={inputStyle}
          value={weightText}
        />
      </View>

      <View style={{ flex: 1 }}>
        <TextInput
          editable={!isCompleted}
          keyboardType="number-pad"
          onBlur={() => void persistDraft()}
          onChangeText={setRepsText}
          placeholder={repsPlaceholder ?? '—'}
          placeholderTextColor="rgba(240,237,232,0.35)"
          style={inputStyle}
          value={repsText}
        />
      </View>

      <View style={{ alignItems: 'center', flexDirection: 'row', gap: 4, width: 62 }}>
        <Pressable
          accessibilityLabel={isCompleted ? 'Mark set incomplete' : 'Complete set'}
          accessibilityRole="button"
          disabled={isBusy}
          onPress={() => void handleToggleComplete()}
          style={{
            alignItems: 'center',
            backgroundColor: isCompleted ? 'rgba(200,255,90,0.12)' : 'transparent',
            borderColor: isCompleted ? LIME : 'rgba(255,255,255,0.11)',
            borderRadius: 7,
            borderWidth: isCompleted ? 1 : 1.5,
            height: 28,
            justifyContent: 'center',
            width: 28,
          }}
        >
          {isCompleted ? <Check color={LIME} size={16} strokeWidth={3} /> : null}
        </Pressable>

        {canRemove ? (
          <Pressable
            accessibilityLabel="Remove set"
            accessibilityRole="button"
            disabled={isBusy}
            onPress={onRemove}
            style={({ hovered, pressed }) => ({
              alignItems: 'center',
              backgroundColor: 'rgba(255,95,95,0.08)',
              borderColor: 'rgba(255,95,95,0.28)',
              borderRadius: 7,
              borderWidth: 1,
              height: 28,
              justifyContent: 'center',
              opacity: hovered || pressed ? 0.75 : 1,
              width: 28,
            })}
          >
            <Trash2 color="rgba(255,95,95,0.9)" size={14} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

interface ExerciseCardProps {
  workoutExercise: WorkoutExercise & { exercise: Exercise; sets: Set[] };
  unit: 'kg' | 'lb';
  splitColor: string;
}

export function ExerciseCard({
  workoutExercise,
  unit,
  splitColor,
}: ExerciseCardProps) {
  const createSet = useCreateSet();
  const deleteSet = useDeleteSet();
  const expandedExerciseIds = useWorkoutSessionStore(
    (s) => s.expandedExerciseIds,
  );
  const toggleExerciseExpanded = useWorkoutSessionStore(
    (s) => s.toggleExerciseExpanded,
  );
  const exerciseTargets = useWorkoutSessionStore(
    (s) => s.exerciseTargets[workoutExercise.id],
  );
  const { data: history } = useExerciseHistory(workoutExercise.exercise.id);

  const isExpanded = expandedExerciseIds.has(workoutExercise.id);
  const sets = workoutExercise.sets ?? [];
  const completedCount = sets.filter((set) => set.completed_at).length;
  const hasPr = sets.some((set) => set.is_pr && set.completed_at);

  const previousSetWeights = useMemo(() => {
    const lastSession = history?.sessions[0];
    if (!lastSession) return new Map<number, number>();

    return new Map(
      lastSession.sets
        .filter((set) => !set.is_warmup)
        .map((set) => [set.set_number, set.weight ?? 0]),
    );
  }, [history?.sessions]);

  const targetScheme = formatTargetScheme(
    exerciseTargets?.targetWeight,
    exerciseTargets?.targetSets,
    exerciseTargets?.targetReps,
    unit,
  );

  const repsPlaceholder = exerciseTargets?.targetReps
    ? String(exerciseTargets.targetReps)
    : undefined;
  const [removingSetId, setRemovingSetId] = useState<string | null>(null);
  const canRemoveSet = sets.length > 1;

  const handleRemoveSet = async (set: Set) => {
    setRemovingSetId(set.id);
    try {
      await deleteSet.mutateAsync({
        id: set.id,
        workoutExerciseId: workoutExercise.id,
      });
    } finally {
      setRemovingSetId(null);
    }
  };

  const handleAddSet = async () => {
    const sortedSets = [...sets].sort((a, b) => a.set_number - b.set_number);
    const previousSet = sortedSets[sortedSets.length - 1];
    const nextNumber = previousSet ? previousSet.set_number + 1 : 1;

    await createSet.mutateAsync({
      workout_exercise_id: workoutExercise.id,
      set_number: nextNumber,
      weight: previousSet?.weight ?? null,
      reps: previousSet?.reps ?? null,
      is_warmup: previousSet?.is_warmup ?? false,
    });
  };

  return (
    <View
      style={{
        backgroundColor: CARD_BG,
        borderColor: BORDER,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 10,
        overflow: 'hidden',
      }}
    >
      <Pressable
        onPress={() => toggleExerciseExpanded(workoutExercise.id)}
        style={({ hovered, pressed }) => ({
          alignItems: 'center',
          backgroundColor:
            hovered || pressed ? 'rgba(255,255,255,0.02)' : 'transparent',
          flexDirection: 'row',
          gap: 10,
          paddingHorizontal: 14,
          paddingVertical: 12,
        })}
      >
        <View
          style={{
            backgroundColor: splitColor,
            borderRadius: 999,
            height: 8,
            width: 8,
          }}
        />

        <View style={{ alignItems: 'center', flex: 1, flexDirection: 'row', gap: 8 }}>
          <AppText
            style={{
              color: colors.text,
              flexShrink: 1,
              fontFamily: fonts.bodySemiBold,
              fontSize: 13,
            }}
          >
            {workoutExercise.exercise.name}
          </AppText>

          {hasPr ? (
            <View
              style={{
                backgroundColor: GOLD,
                borderRadius: 3,
                paddingHorizontal: 6,
                paddingVertical: 1,
              }}
            >
              <Text
                style={{
                  color: TEXT_DARK,
                  fontFamily: fonts.jetbrainsMono,
                  fontSize: 9,
                  fontWeight: '700',
                }}
              >
                PR
              </Text>
            </View>
          ) : null}

          {completedCount > 0 ? (
            <View
              style={{
                borderColor: 'rgba(245,200,66,0.35)',
                borderRadius: 999,
                borderWidth: 1,
                paddingHorizontal: 6,
                paddingVertical: 1,
              }}
            >
              <Text
                style={{
                  color: GOLD,
                  fontFamily: fonts.jetbrainsMono,
                  fontSize: 10,
                }}
              >
                {completedCount}/{sets.length}
              </Text>
            </View>
          ) : null}
        </View>

        {targetScheme ? (
          <Text
            style={{
              color: MUTED,
              fontFamily: fonts.jetbrainsMono,
              fontSize: 10,
            }}
          >
            {targetScheme}
          </Text>
        ) : null}

        <View
          style={{
            transform: [{ rotate: isExpanded ? '180deg' : '0deg' }],
          }}
        >
          <ChevronDown color={MUTED} size={18} />
        </View>
      </Pressable>

      {isExpanded ? (
        <View style={{ paddingBottom: 14, paddingHorizontal: 14 }}>
          <View style={{ backgroundColor: BORDER, height: 1, marginBottom: 10 }} />

          <View
            style={{
              alignItems: 'center',
              flexDirection: 'row',
              gap: 8,
              marginBottom: 8,
            }}
          >
            <Text
              style={{
                color: TABLE_HEADER,
                fontFamily: fonts.jetbrainsMono,
                fontSize: 9,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                width: 22,
              }}
            >
              Set
            </Text>
            <Text
              style={{
                color: TABLE_HEADER,
                flex: 1,
                fontFamily: fonts.jetbrainsMono,
                fontSize: 9,
                letterSpacing: 1.5,
                textAlign: 'center',
                textTransform: 'uppercase',
              }}
            >
              {unit === 'lb' ? 'Lb' : 'Kg'}
            </Text>
            <Text
              style={{
                color: TABLE_HEADER,
                flex: 1,
                fontFamily: fonts.jetbrainsMono,
                fontSize: 9,
                letterSpacing: 1.5,
                textAlign: 'center',
                textTransform: 'uppercase',
              }}
            >
              Reps
            </Text>
            <View style={{ alignItems: 'center', width: 62 }}>
              <Text
                style={{
                  color: TABLE_HEADER,
                  fontFamily: fonts.jetbrainsMono,
                  fontSize: 9,
                  letterSpacing: 1.5,
                  textAlign: 'center',
                  textTransform: 'uppercase',
                }}
              >
                Done
              </Text>
            </View>
          </View>

          <View style={{ gap: 8 }}>
            {sets.map((set) => {
              const previousWeight = previousSetWeights.get(set.set_number);
              const weightPlaceholder =
                previousWeight != null && previousWeight > 0
                  ? kgToDisplay(previousWeight, unit)
                  : exerciseTargets?.targetWeight
                    ? kgToDisplay(exerciseTargets.targetWeight, unit)
                    : undefined;

              return (
                <SetRow
                  key={set.id}
                  canRemove={canRemoveSet}
                  exercise={workoutExercise.exercise}
                  isRemoving={removingSetId === set.id}
                  onRemove={() => void handleRemoveSet(set)}
                  repsPlaceholder={repsPlaceholder}
                  set={set}
                  unit={unit}
                  weightPlaceholder={weightPlaceholder}
                />
              );
            })}
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={createSet.isPending}
            onPress={() => void handleAddSet()}
            style={{
              alignItems: 'center',
              borderColor: 'rgba(255,255,255,0.11)',
              borderRadius: 8,
              borderWidth: 1,
              marginTop: 10,
              paddingVertical: 10,
            }}
          >
            <Text
              style={{
                color: MUTED,
                fontFamily: fonts.body,
                fontSize: 11,
              }}
            >
              Add Set
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
