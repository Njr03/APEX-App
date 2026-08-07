import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { format, isSameDay, parseISO } from 'date-fns';
import { ChevronLeft, X } from 'lucide-react-native';

import { WorkoutCalendar } from '@/components/history/WorkoutCalendar';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { QueryError } from '@/components/ui/QueryState';
import { TabPageHeading } from '@/components/ui/TabPageHeading';
import { WorkoutSessionDetail } from '@/components/workout/WorkoutSessionDetail';
import { useProfile, useWorkout, useWorkoutHistory } from '@/hooks/queries';
import { useThisWeekSplits } from '@/hooks/useThisWeekSplits';
import { colors, fonts } from '@/constants/theme';
import { resolveUnitPreference } from '@/lib/profile/unitPreference';
import { getSupabaseErrorMessage } from '@/lib/supabase/errors';
import { getSplitTemplate } from '@/lib/training/splitTemplates';
import {
  SPLIT_DEFINITIONS,
  type TrainingSplit,
} from '@/lib/training/splits';
import {
  buildCalendarDayMarkers,
  getSessionsForDate,
  getUpcomingSessionLabel,
  type SessionListItem,
} from '@/lib/training/scheduledSessions';
import { formatExerciseScheme } from '@/lib/workout/formatSessionVolume';
import { kgToDisplay, volumeLabel } from '@/lib/units';
import { formatElapsedDuration } from '@/hooks/useWorkoutTimer';

const CARD_BG = '#0d0d1b';
const CARD_BORDER = 'rgba(255,255,255,0.06)';
const MUTED = 'rgba(240,237,232,0.5)';
const COMPLETED_COLOR = colors.accent;

interface WorkoutHistoryModalProps {
  visible: boolean;
  onClose: () => void;
}

type DetailView =
  | { kind: 'workout'; workoutId: string }
  | { kind: 'upcoming'; split: TrainingSplit; date: Date };

function UpcomingSessionDetail({
  split,
  date,
  unit,
}: {
  split: TrainingSplit;
  date: Date;
  unit: 'kg' | 'lb';
}) {
  const definition = SPLIT_DEFINITIONS[split];
  const template = getSplitTemplate(split);

  return (
    <View
      className="gap-4"
      style={{
        backgroundColor: definition.todayGlow,
        borderColor: definition.todayBorder,
        borderRadius: 12,
        borderWidth: 1,
        padding: 12,
      }}
    >
      <View className="gap-1">
        <Text
          style={{
            color: definition.color,
            fontFamily: fonts.jetbrainsMono,
            fontSize: 10,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
          }}
        >
          {definition.eyebrow}
        </Text>
        <AppText variant="display">{getUpcomingSessionLabel(split)}</AppText>
        <AppText variant="muted">
          Scheduled · {format(date, 'EEEE, MMM d, yyyy')}
        </AppText>
      </View>

      <Card className="gap-2">
        <AppText variant="muted">{definition.muscles}</AppText>
      </Card>

      <View className="gap-2">
        <AppText variant="display">Planned exercises</AppText>
        {template.exercises.map((exercise) => (
          <Card key={exercise.exerciseName}>
            <View className="flex-row items-center justify-between gap-3">
              <AppText className="flex-1" variant="body">
                {exercise.exerciseName}
              </AppText>
              <AppText variant="mono">
                {formatExerciseScheme(
                  exercise.sets,
                  exercise.reps,
                  exercise.weightKg,
                  unit,
                )}
              </AppText>
            </View>
          </Card>
        ))}
      </View>
    </View>
  );
}

function WorkoutHistoryDetailPanel({
  detail,
  unit,
  onBack,
}: {
  detail: DetailView;
  unit: 'kg' | 'lb';
  onBack: () => void;
}) {
  const { data: workout, isLoading, isError, error } = useWorkout(
    detail.kind === 'workout' ? detail.workoutId : undefined,
  );

  return (
    <View className="gap-4">
      <Pressable
        accessibilityLabel="Back to session list"
        accessibilityRole="button"
        className="flex-row items-center gap-1 self-start active:opacity-70"
        onPress={onBack}
      >
        <ChevronLeft color={colors.accent} size={18} />
        <AppText className="text-accent" variant="body">
          Back
        </AppText>
      </Pressable>

      {detail.kind === 'upcoming' ? (
        <UpcomingSessionDetail
          date={detail.date}
          split={detail.split}
          unit={unit}
        />
      ) : isLoading ? (
        <ActivityIndicator color={colors.accent} />
      ) : isError || !workout ? (
        <QueryError message={getSupabaseErrorMessage(error)} />
      ) : (
        <View
          style={{
            backgroundColor: 'rgba(200,255,90,0.04)',
            borderColor: 'rgba(200,255,90,0.2)',
            borderRadius: 12,
            borderWidth: 1,
            padding: 12,
          }}
        >
          <WorkoutSessionDetail embedded unit={unit} workout={workout} />
        </View>
      )}
    </View>
  );
}

function SessionListItemCard({
  item,
  unit,
  onPress,
}: {
  item: SessionListItem;
  unit: 'kg' | 'lb';
  onPress: () => void;
}) {
  if (item.type === 'completed') {
    const workout = item.workout;

    return (
      <Pressable className="active:opacity-80" onPress={onPress}>
        <Card
          className="gap-2"
          style={{
            backgroundColor: 'rgba(200,255,90,0.06)',
            borderColor: 'rgba(200,255,90,0.28)',
            borderWidth: 1,
          }}
        >
          <View className="flex-row items-center justify-between gap-3">
            <AppText
              className="flex-1"
              style={{ color: COMPLETED_COLOR }}
              variant="display"
            >
              {workout.name}
            </AppText>
            <View
              style={{
                backgroundColor: 'rgba(200,255,90,0.12)',
                borderColor: 'rgba(200,255,90,0.35)',
                borderRadius: 999,
                borderWidth: 1,
                paddingHorizontal: 8,
                paddingVertical: 2,
              }}
            >
              <Text
                style={{
                  color: COMPLETED_COLOR,
                  fontFamily: fonts.jetbrainsMono,
                  fontSize: 9,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}
              >
                Completed
              </Text>
            </View>
          </View>
          <AppText variant="muted">
            {format(parseISO(workout.started_at), 'h:mm a')}
          </AppText>
          <View className="flex-row gap-4">
            <View>
              <AppText variant="muted">Duration</AppText>
              <AppText style={{ color: COMPLETED_COLOR }} variant="mono">
                {workout.duration_seconds != null
                  ? formatElapsedDuration(workout.duration_seconds)
                  : '—'}
              </AppText>
            </View>
            <View>
              <AppText variant="muted">Volume</AppText>
              <AppText style={{ color: COMPLETED_COLOR }} variant="mono">
                {kgToDisplay(workout.total_volume, unit)} {volumeLabel(unit)}
              </AppText>
            </View>
          </View>
        </Card>
      </Pressable>
    );
  }

  const definition = SPLIT_DEFINITIONS[item.split];

  return (
    <Pressable className="active:opacity-80" onPress={onPress}>
      <Card
        className="gap-2"
        style={{
          backgroundColor: definition.todayGlow,
          borderColor: definition.todayBorder,
          borderWidth: 1,
        }}
      >
        <View className="flex-row items-center justify-between gap-3">
          <AppText
            className="flex-1"
            style={{ color: definition.color }}
            variant="display"
          >
            {getUpcomingSessionLabel(item.split)}
          </AppText>
          <View
            style={{
              backgroundColor: definition.todayGlow,
              borderColor: definition.todayBorder,
              borderRadius: 999,
              borderWidth: 1,
              paddingHorizontal: 8,
              paddingVertical: 2,
            }}
          >
            <Text
              style={{
                color: definition.color,
                fontFamily: fonts.jetbrainsMono,
                fontSize: 9,
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
            >
              Upcoming
            </Text>
          </View>
        </View>
        <AppText style={{ color: definition.color, opacity: 0.75 }} variant="muted">
          {definition.muscles}
        </AppText>
      </Card>
    </Pressable>
  );
}

export function WorkoutHistoryModal({
  visible,
  onClose,
}: WorkoutHistoryModalProps) {
  const { data: profile } = useProfile();
  const {
    data: workouts,
    isLoading,
    isError,
    error,
    refetch,
  } = useWorkoutHistory();
  const { data: weekSplits } = useThisWeekSplits();

  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [detail, setDetail] = useState<DetailView | null>(null);

  const unit = resolveUnitPreference(profile?.unit_preference);
  const cards = weekSplits?.cards ?? [];

  useEffect(() => {
    if (!visible) {
      setDetail(null);
      setSelectedDate(new Date());
      setMonth(new Date());
    }
  }, [visible]);

  const { trainingDays } = useMemo(
    () => buildCalendarDayMarkers(month, workouts ?? [], cards),
    [cards, month, workouts],
  );

  const sessions = useMemo(
    () => getSessionsForDate(selectedDate, workouts ?? [], cards),
    [cards, selectedDate, workouts],
  );

  const handleClose = () => {
    setDetail(null);
    onClose();
  };

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
            maxHeight: '88%',
            maxWidth: 480,
            padding: 18,
            width: '100%',
          }}
        >
          <View className="mb-4 flex-row items-start justify-between gap-3">
            <View className="flex-1 gap-1">
              <TabPageHeading title="Workout History" />
              <Text style={{ color: MUTED, fontFamily: fonts.body, fontSize: 11 }}>
                Past sessions and upcoming training days
              </Text>
            </View>
            <Pressable accessibilityLabel="Close" onPress={handleClose}>
              <X color={MUTED} size={18} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ gap: 16, paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
          >
            {detail ? (
              <WorkoutHistoryDetailPanel
                detail={detail}
                onBack={() => setDetail(null)}
                unit={unit}
              />
            ) : (
              <>
                {isLoading ? (
                  <ActivityIndicator color={colors.accent} />
                ) : isError ? (
                  <QueryError
                    message={getSupabaseErrorMessage(error)}
                    onRetry={() => void refetch()}
                  />
                ) : (
                  <>
                    <WorkoutCalendar
                      month={month}
                      onMonthChange={setMonth}
                      onSelectDate={(date) => {
                        setSelectedDate((current) =>
                          current && isSameDay(current, date) ? current : date,
                        );
                      }}
                      selectedDate={selectedDate}
                      trainingDays={trainingDays}
                    />

                    <AppText variant="display">
                      {format(selectedDate, 'MMM d, yyyy')}
                    </AppText>

                    {sessions.length === 0 ? (
                      <Card>
                        <AppText variant="muted">
                          No sessions on this day.
                        </AppText>
                      </Card>
                    ) : (
                      <View className="gap-2">
                        {sessions.map((session) => (
                          <SessionListItemCard
                            key={
                              session.type === 'completed'
                                ? session.workout.id
                                : `${session.split}-${session.date.toISOString()}`
                            }
                            item={session}
                            onPress={() =>
                              setDetail(
                                session.type === 'completed'
                                  ? {
                                      kind: 'workout',
                                      workoutId: session.workout.id,
                                    }
                                  : {
                                      kind: 'upcoming',
                                      split: session.split,
                                      date: session.date,
                                    },
                              )
                            }
                            unit={unit}
                          />
                        ))}
                      </View>
                    )}
                  </>
                )}
              </>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
