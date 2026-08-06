import { router } from 'expo-router';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { format, parseISO } from 'date-fns';
import { X } from 'lucide-react-native';

import { useWorkout } from '@/hooks/queries';
import type { WeekSplitCardData } from '@/hooks/useThisWeekSplits';
import { colors, fonts } from '@/constants/theme';
import { wrapDashboardModalClose } from '@/lib/dashboard/cardStyles';
import { getSplitTemplate } from '@/lib/training/splitTemplates';
import {
  formatSplitDay,
  formatSplitDuration,
  formatSplitVolume,
} from '@/lib/training/weekSplits';
import {
  formatExerciseScheme,
  summarizeLoggedExerciseSets,
} from '@/lib/workout/formatSessionVolume';

const CARD_BG = '#0d0d1b';
const CARD_BORDER = 'rgba(255,255,255,0.06)';
const MUTED = 'rgba(240,237,232,0.5)';

interface WeekSplitCardBreakdownModalProps {
  card: WeekSplitCardData | null;
  unit: 'kg' | 'lb';
  visible: boolean;
  onClose: () => void;
}

function DetailRow({
  label,
  value,
  valueColor = colors.text,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View className="flex-row items-center justify-between" style={{ gap: 12 }}>
      <Text style={{ color: MUTED, fontFamily: fonts.body, fontSize: 11 }}>{label}</Text>
      <Text
        style={{
          color: valueColor,
          fontFamily: fonts.jetbrainsMono,
          fontSize: 11,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export function WeekSplitCardBreakdownModal({
  card,
  unit,
  visible,
  onClose,
}: WeekSplitCardBreakdownModalProps) {
  const handleClose = wrapDashboardModalClose(onClose);
  const workoutId = card?.completedWorkoutId ?? null;
  const { data: workout, isLoading } = useWorkout(workoutId ?? undefined);

  if (!card) return null;

  const { definition, status, completedSession, lastSession } = card;
  const session = completedSession ?? lastSession;
  const template = getSplitTemplate(definition.id);

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={handleClose}>
      <Pressable
        className="flex-1 items-center justify-center px-5"
        style={{ backgroundColor: 'rgba(0,0,0,0.72)' }}
        onPress={handleClose}
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={{
            backgroundColor: CARD_BG,
            borderColor: CARD_BORDER,
            borderRadius: 16,
            borderWidth: 1,
            maxHeight: '80%',
            maxWidth: 420,
            padding: 18,
            width: '100%',
          }}
        >
          <View className="flex-row items-start justify-between" style={{ gap: 12 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text
                style={{
                  color: definition.color,
                  fontFamily: fonts.jetbrainsMono,
                  fontSize: 9,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                }}
              >
                {definition.eyebrow}
              </Text>
              <Text
                style={{
                  color: colors.text,
                  fontFamily: fonts.brand,
                  fontSize: 20,
                  fontWeight: '700',
                }}
              >
                {definition.name}
              </Text>
              <Text style={{ color: MUTED, fontFamily: fonts.body, fontSize: 11 }}>
                {card.targetMuscles || definition.muscles}
              </Text>
            </View>
            <Pressable accessibilityLabel="Close" onPress={handleClose}>
              <X color={MUTED} size={18} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ gap: 14, paddingTop: 16 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ gap: 8 }}>
              <Text
                style={{
                  color: MUTED,
                  fontFamily: fonts.jetbrainsMono,
                  fontSize: 9,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                }}
              >
                Status
              </Text>
              <Text
                style={{
                  color: definition.color,
                  fontFamily: fonts.bodySemiBold,
                  fontSize: 13,
                }}
              >
                {status === 'completed'
                  ? 'Completed this week'
                  : status === 'today'
                    ? 'Scheduled today'
                    : 'Upcoming this week'}
              </Text>
            </View>

            {session ? (
              <View style={{ gap: 8 }}>
                <Text
                  style={{
                    color: MUTED,
                    fontFamily: fonts.jetbrainsMono,
                    fontSize: 9,
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                  }}
                >
                  {completedSession ? 'This week session' : 'Last session'}
                </Text>
                <DetailRow
                  label="Day"
                  value={`${formatSplitDay(session.startedAt)} · ${format(parseISO(session.startedAt), 'MMM d, yyyy')}`}
                />
                <DetailRow
                  label="Volume"
                  value={formatSplitVolume(session.totalVolume, unit)}
                  valueColor={definition.color}
                />
                <DetailRow
                  label="Duration"
                  value={formatSplitDuration(session.durationSeconds)}
                />
                <DetailRow
                  label="Exercises"
                  value={String(session.exerciseCount)}
                />
                <DetailRow
                  label="PRs"
                  value={session.prCount > 0 ? String(session.prCount) : '—'}
                  valueColor={colors.gold}
                />
              </View>
            ) : null}

            <View style={{ backgroundColor: CARD_BORDER, height: 1 }} />

            <View style={{ gap: 10 }}>
              <Text
                style={{
                  color: MUTED,
                  fontFamily: fonts.jetbrainsMono,
                  fontSize: 9,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                }}
              >
                Workout breakdown
              </Text>

              {isLoading && workoutId ? (
                <ActivityIndicator color={colors.accent} />
              ) : null}

              {workout?.workout_exercises?.length
                ? workout.workout_exercises.map((entry) => {
                    const scheme = summarizeLoggedExerciseSets(
                      entry.sets ?? [],
                      unit,
                    );

                    return (
                      <View
                        key={entry.id}
                        className="flex-row items-center justify-between"
                        style={{ gap: 10 }}
                      >
                        <Text
                          className="flex-1"
                          numberOfLines={1}
                          style={{
                            color: colors.text,
                            fontFamily: fonts.bodyMedium,
                            fontSize: 12,
                          }}
                        >
                          {entry.exercise.name}
                        </Text>
                        <Text
                          style={{
                            color: MUTED,
                            fontFamily: fonts.jetbrainsMono,
                            fontSize: 10,
                          }}
                        >
                          {scheme ??
                            formatExerciseScheme(
                              entry.sets?.length ?? 0,
                              null,
                              null,
                              unit,
                            )}
                        </Text>
                      </View>
                    );
                  })
                : template.exercises.map((exercise) => (
                    <View
                      key={exercise.exerciseName}
                      className="flex-row items-center justify-between"
                      style={{ gap: 10 }}
                    >
                      <Text
                        className="flex-1"
                        numberOfLines={1}
                        style={{
                          color: colors.text,
                          fontFamily: fonts.bodyMedium,
                          fontSize: 12,
                        }}
                      >
                        {exercise.exerciseName}
                      </Text>
                      <Text
                        style={{
                          color: MUTED,
                          fontFamily: fonts.jetbrainsMono,
                          fontSize: 10,
                        }}
                      >
                        {formatExerciseScheme(
                          exercise.sets,
                          exercise.reps,
                          exercise.weightKg,
                          unit,
                        )}
                      </Text>
                    </View>
                  ))}
            </View>

            {status === 'today' ? (
              <Pressable
                onPress={() => {
                  onClose();
                  router.push({
                    pathname: '/workout/confirm',
                    params: { split: definition.id },
                  });
                }}
                style={{
                  alignItems: 'center',
                  backgroundColor: definition.color,
                  borderRadius: 10,
                  paddingVertical: 12,
                }}
              >
                <Text
                  style={{
                    color: '#07070f',
                    fontFamily: fonts.brand,
                    fontSize: 13,
                    fontWeight: '700',
                  }}
                >
                  Start Now
                </Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
