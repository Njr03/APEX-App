import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Flag } from 'lucide-react-native';

import {
  formatElapsedDuration,
  useWorkoutTimer,
} from '@/hooks/useWorkoutTimer';
import { useLayoutBreakpoint } from '@/hooks/useLayoutBreakpoint';
import { colors, fonts } from '@/constants/theme';
import {
  inferSplitFromWorkoutName,
  SPLIT_DEFINITIONS,
  type TrainingSplit,
} from '@/lib/training/splits';
import { useWorkoutSessionStore } from '@/stores/workoutSessionStore';

const CARD_BG = '#0d0d1b';
const BORDER = 'rgba(255,255,255,0.06)';
const MUTED = 'rgba(240,237,232,0.5)';
const LIME = '#c8ff5a';
const TEXT_DARK = '#08080f';
const DANGER = '#ff5f5f';

interface WorkoutHeaderProps {
  name: string;
  startedAt: string;
  isFinishing: boolean;
  isCancelling?: boolean;
  onFinish: () => void;
  onCancel: () => void;
  showFinishButton?: boolean;
}

function resolveActiveSplit(
  name: string,
  storedSplit: TrainingSplit | null,
): TrainingSplit | null {
  return storedSplit ?? inferSplitFromWorkoutName(name);
}

function HeaderTextButton({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}) {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ hovered, pressed }) => ({
        alignItems: 'center',
        backgroundColor: isPrimary
          ? LIME
          : isDanger
            ? 'rgba(255,95,95,0.1)'
            : 'rgba(255,255,255,0.04)',
        borderColor: isPrimary
          ? LIME
          : isDanger
            ? 'rgba(255,95,95,0.35)'
            : 'rgba(255,255,255,0.12)',
        borderRadius: 10,
        borderWidth: 1,
        justifyContent: 'center',
        minWidth: 72,
        opacity: disabled ? 0.55 : hovered || pressed ? 0.88 : 1,
        paddingHorizontal: 14,
        paddingVertical: 10,
      })}
    >
      <Text
        style={{
          color: isPrimary ? TEXT_DARK : isDanger ? DANGER : colors.text,
          fontFamily: fonts.brand,
          fontSize: 12,
          fontWeight: '700',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function FinishButton({
  isFinishing,
  onFinish,
  fullWidth = false,
}: {
  isFinishing: boolean;
  onFinish: () => void;
  fullWidth?: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel="Finish workout"
      accessibilityRole="button"
      disabled={isFinishing}
      onPress={onFinish}
      style={({ hovered, pressed }) => ({
        alignItems: 'center',
        alignSelf: fullWidth ? ('stretch' as const) : undefined,
        backgroundColor: LIME,
        borderRadius: 10,
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'center',
        opacity: isFinishing ? 0.6 : hovered || pressed ? 0.88 : 1,
        paddingHorizontal: fullWidth ? 16 : 22,
        paddingVertical: 12,
        width: fullWidth ? '100%' : undefined,
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
  );
}

function SessionControls({
  isWorkoutPaused,
  isCancelling,
  isFinishing,
  onPause,
  onResume,
  onCancel,
}: {
  isWorkoutPaused: boolean;
  isCancelling?: boolean;
  isFinishing: boolean;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
}) {
  const controlsDisabled = isFinishing || isCancelling;

  return (
    <View style={{ alignItems: 'center', flexDirection: 'row', gap: 8 }}>
      <HeaderTextButton
        disabled={controlsDisabled}
        label={isWorkoutPaused ? 'Resume' : 'Pause'}
        onPress={isWorkoutPaused ? onResume : onPause}
        variant="primary"
      />
      <HeaderTextButton
        disabled={controlsDisabled}
        label="Cancel"
        onPress={onCancel}
        variant="danger"
      />
    </View>
  );
}

export function WorkoutHeader({
  name,
  startedAt,
  isFinishing,
  isCancelling = false,
  onFinish,
  onCancel,
  showFinishButton = true,
}: WorkoutHeaderProps) {
  const { isCompact } = useLayoutBreakpoint();
  const storedSplit = useWorkoutSessionStore((s) => s.activeSplit);
  const isWorkoutPaused = useWorkoutSessionStore((s) => s.isWorkoutPaused);
  const pauseWorkout = useWorkoutSessionStore((s) => s.pauseWorkout);
  const resumeWorkout = useWorkoutSessionStore((s) => s.resumeWorkout);
  const elapsed = useWorkoutTimer(startedAt);

  const activeSplit = resolveActiveSplit(name, storedSplit);
  const definition = activeSplit ? SPLIT_DEFINITIONS[activeSplit] : null;

  if (isCompact) {
    return (
      <View className="px-5 pb-3 pt-3">
        <View
          style={{
            backgroundColor: CARD_BG,
            borderColor: BORDER,
            borderRadius: 14,
            borderWidth: 1,
            gap: 14,
            paddingHorizontal: 16,
            paddingVertical: 16,
          }}
        >
          <View
            style={{
              alignItems: 'center',
              flexDirection: 'row',
              gap: 12,
            }}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{
                  color: isWorkoutPaused ? MUTED : colors.text,
                  fontFamily: fonts.brand,
                  fontSize: 32,
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

            <SessionControls
              isCancelling={isCancelling}
              isFinishing={isFinishing}
              isWorkoutPaused={isWorkoutPaused}
              onCancel={onCancel}
              onPause={pauseWorkout}
              onResume={resumeWorkout}
            />
          </View>

          {definition ? (
            <View
              style={{
                borderColor: BORDER,
                borderTopWidth: 1,
                paddingTop: 12,
              }}
            >
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
                  fontSize: 14,
                  fontWeight: '700',
                  marginTop: 2,
                }}
              >
                {definition.name}
              </Text>
            </View>
          ) : null}

          {showFinishButton ? (
            <FinishButton fullWidth isFinishing={isFinishing} onFinish={onFinish} />
          ) : null}
        </View>
      </View>
    );
  }

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
          flexWrap: 'wrap',
          gap: 12,
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

        <SessionControls
          isCancelling={isCancelling}
          isFinishing={isFinishing}
          isWorkoutPaused={isWorkoutPaused}
          onCancel={onCancel}
          onPause={pauseWorkout}
          onResume={resumeWorkout}
        />

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

        {showFinishButton ? (
          <FinishButton isFinishing={isFinishing} onFinish={onFinish} />
        ) : null}
      </View>
    </View>
  );
}
