import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { format, isSameDay, parseISO } from 'date-fns';
import { ChevronLeft, X } from 'lucide-react-native';

import { WorkoutCalendar } from '@/components/history/WorkoutCalendar';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { QueryError } from '@/components/ui/QueryState';
import { TabPageHeading } from '@/components/ui/TabPageHeading';
import { Text } from '@/components/ui/Text';
import { WorkoutSessionDetail } from '@/components/workout/WorkoutSessionDetail';
import { useProfile, useWorkout, useWorkoutHistory } from '@/hooks/queries';
import { colors, fonts } from '@/constants/theme';
import { resolveUnitPreference } from '@/lib/profile/unitPreference';
import { getSupabaseErrorMessage } from '@/lib/supabase/errors';
import { buildCalendarDayMarkers } from '@/lib/training/scheduledSessions';
import { kgToDisplay, volumeLabel } from '@/lib/units';
import { formatElapsedDuration } from '@/hooks/useWorkoutTimer';
import type { Workout } from '@/lib/supabase';

const CARD_BG = '#0d0d1b';
const CARD_BORDER = 'rgba(255,255,255,0.06)';
const MUTED = 'rgba(240,237,232,0.5)';
const COMPLETED_COLOR = colors.accent;

interface WorkoutHistoryModalProps {
  visible: boolean;
  onClose: () => void;
}

function getCompletedWorkoutsForDate(date: Date, workouts: Workout[]): Workout[] {
  return workouts.filter(
    (workout) =>
      workout.status === 'completed' &&
      isSameDay(parseISO(workout.started_at), date),
  );
}

function WorkoutHistoryDetailPanel({
  workoutId,
  unit,
  onBack,
}: {
  workoutId: string;
  unit: 'kg' | 'lb';
  onBack: () => void;
}) {
  const { data: workout, isLoading, isError, error } = useWorkout(workoutId);

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

      {isLoading ? (
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

function CompletedSessionCard({
  workout,
  unit,
  onPress,
}: {
  workout: Workout;
  unit: 'kg' | 'lb';
  onPress: () => void;
}) {
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

  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);

  const unit = resolveUnitPreference(profile?.unit_preference);

  useEffect(() => {
    if (!visible) {
      setSelectedWorkoutId(null);
      setSelectedDate(new Date());
      setMonth(new Date());
    }
  }, [visible]);

  const { trainingDays } = useMemo(
    () => buildCalendarDayMarkers(month, workouts ?? [], []),
    [month, workouts],
  );

  const completedSessions = useMemo(
    () => getCompletedWorkoutsForDate(selectedDate, workouts ?? []),
    [selectedDate, workouts],
  );

  const handleClose = () => {
    setSelectedWorkoutId(null);
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
            <View className="flex-1">
              <TabPageHeading title="Workout History" />
            </View>
            <Pressable accessibilityLabel="Close" onPress={handleClose}>
              <X color={MUTED} size={18} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ gap: 16, paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
          >
            {selectedWorkoutId ? (
              <WorkoutHistoryDetailPanel
                onBack={() => setSelectedWorkoutId(null)}
                unit={unit}
                workoutId={selectedWorkoutId}
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

                    {completedSessions.length === 0 ? (
                      <Card>
                        <AppText variant="muted">
                          No logged sessions on this day.
                        </AppText>
                      </Card>
                    ) : (
                      <View className="gap-2">
                        {completedSessions.map((workout) => (
                          <CompletedSessionCard
                            key={workout.id}
                            onPress={() => setSelectedWorkoutId(workout.id)}
                            unit={unit}
                            workout={workout}
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
