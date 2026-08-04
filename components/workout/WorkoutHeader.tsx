import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Flag, Pause, Play } from 'lucide-react-native';

import {
  formatElapsedDuration,
  useWorkoutTimer,
} from '@/hooks/useWorkoutTimer';
import { colors, fonts } from '@/constants/theme';
import {
  inferSplitFromWorkoutName,
  SPLIT_DEFINITIONS,
  type TrainingSplit,
} from '@/lib/training/splits';
import { formatSessionVolume } from '@/lib/workout/formatSessionVolume';
import {
  calculateWorkoutVolume,
  collectWorkoutSets,
} from '@/lib/workout/volume';
import type { WorkoutExercise, Set, Exercise } from '@/lib/supabase';
import { useWorkoutSessionStore } from '@/stores/workoutSessionStore';

const CARD_BG = '#0d0d1b';
const BORDER = 'rgba(255,255,255,0.06)';
const MUTED = 'rgba(240,237,232,0.5)';
const LIME = '#c8ff5a';
const TEXT_DARK = '#08080f';

interface WorkoutHeaderProps {
  name: string;
  startedAt: string;
  isFinishing: boolean;
  unit: 'kg' | 'lb';
  workoutExercises: Array<WorkoutExercise & { exercise: Exercise; sets: Set[] }>;
  onFinish: () => void;
}

function resolveActiveSplit(
  name: string,
  storedSplit: TrainingSplit | null,
): TrainingSplit | null {
  return storedSplit ?? inferSplitFromWorkoutName(name);
}

export function WorkoutHeader({
  name,
  startedAt,
  isFinishing,
  unit,
  workoutExercises,
  onFinish,
}: WorkoutHeaderProps) {
  const storedSplit = useWorkoutSessionStore((s) => s.activeSplit);
  const isWorkoutPaused = useWorkoutSessionStore((s) => s.isWorkoutPaused);
  const pauseWorkout = useWorkoutSessionStore((s) => s.pauseWorkout);
  const resumeWorkout = useWorkoutSessionStore((s) => s.resumeWorkout);
  const elapsed = useWorkoutTimer(startedAt);

  const activeSplit = resolveActiveSplit(name, storedSplit);
  const definition = activeSplit ? SPLIT_DEFINITIONS[activeSplit] : null;

  const totalVolume = useMemo(
    () => calculateWorkoutVolume(collectWorkoutSets(workoutExercises)),
    [workoutExercises],
  );

  return (
    <View className="px-5 pb-4 pt-3">
      <View
        style={{
          alignItems: 'center',
          backgroundColor: CARD_BG,
          borderColor: BORDER,
          borderRadius: 14,
          borderWidth: 1,
          flexDirection: 'row',
          gap: 16,
          paddingHorizontal: 22,
          paddingVertical: 18,
        }}
      >
        <View style={{ minWidth: 88 }}>
          <Text
            style={{
              color: isWorkoutPaused ? MUTED : colors.text,
              fontFamily: fonts.brand,
              fontSize: 38,
              fontWeight: '700',
              letterSpacing: -1,
            }}
          >
            {formatElapsedDuration(elapsed)}
          </Text>
          <Text
            style={{
              color: isWorkoutPaused ? colors.accent : MUTED,
              fontFamily: fonts.jetbrainsMono,
              fontSize: 9,
              letterSpacing: 2,
              marginTop: 2,
              textTransform: 'uppercase',
            }}
          >
            {isWorkoutPaused ? 'Paused' : 'Elapsed'}
          </Text>
        </View>

        <Pressable
          accessibilityLabel={isWorkoutPaused ? 'Resume workout' : 'Pause workout'}
          accessibilityRole="button"
          onPress={isWorkoutPaused ? resumeWorkout : pauseWorkout}
          style={({ hovered, pressed }) => ({
            alignItems: 'center',
            backgroundColor: isWorkoutPaused ? LIME : 'rgba(255,255,255,0.06)',
            borderColor: isWorkoutPaused ? LIME : 'rgba(255,255,255,0.12)',
            borderRadius: 10,
            borderWidth: 1,
            justifyContent: 'center',
            opacity: hovered || pressed ? 0.88 : 1,
            paddingHorizontal: 12,
            paddingVertical: 12,
          })}
        >
          {isWorkoutPaused ? (
            <Play color={TEXT_DARK} fill={TEXT_DARK} size={16} />
          ) : (
            <Pause color={colors.text} size={16} />
          )}
        </Pressable>

        <View style={{ backgroundColor: BORDER, height: 44, width: 1 }} />

        <View style={{ flex: 1, minWidth: 100 }}>
          <Text
            style={{
              color: definition?.color ?? colors.accent,
              fontFamily: fonts.brand,
              fontSize: 28,
              fontWeight: '700',
            }}
          >
            {formatSessionVolume(totalVolume, unit)}
          </Text>
          <Text
            style={{
              color: MUTED,
              fontFamily: fonts.jetbrainsMono,
              fontSize: 9,
              letterSpacing: 1,
              marginTop: 2,
              textTransform: 'uppercase',
            }}
          >
            Volume this session
          </Text>
        </View>

        {definition ? (
          <View style={{ minWidth: 72 }}>
            <Text
              style={{
                color: MUTED,
                fontFamily: fonts.jetbrainsMono,
                fontSize: 9,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
              }}
            >
              {definition.eyebrow}
            </Text>
            <Text
              style={{
                color: definition.color,
                fontFamily: fonts.brand,
                fontSize: 13,
                fontWeight: '700',
                marginTop: 2,
              }}
            >
              {definition.name}
            </Text>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Finish workout"
          disabled={isFinishing}
          onPress={onFinish}
          style={({ hovered, pressed }) => ({
            alignItems: 'center',
            backgroundColor: LIME,
            borderRadius: 10,
            flexDirection: 'row',
            gap: 8,
            opacity: isFinishing ? 0.6 : hovered || pressed ? 0.88 : 1,
            paddingHorizontal: 22,
            paddingVertical: 12,
          })}
        >
          <Flag color={TEXT_DARK} size={16} />
          <Text
            style={{
              color: TEXT_DARK,
              fontFamily: fonts.brand,
              fontSize: 13,
              fontWeight: '700',
            }}
          >
            Finish Workout
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
