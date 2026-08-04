import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  View,
} from 'react-native';
import { format, isSameDay, isWithinInterval, parseISO } from 'date-fns';

import { WorkoutCalendar } from '@/components/history/WorkoutCalendar';
import { AppText } from '@/components/ui/AppText';
import { BackButton } from '@/components/ui/BackButton';
import { Card } from '@/components/ui/Card';
import { QueryError } from '@/components/ui/QueryState';
import { Screen } from '@/components/ui/Screen';
import { useProfile, useWorkoutHistory } from '@/hooks/queries';
import { colors } from '@/constants/theme';
import { getTrainingDayKeys, workoutsOnDate } from '@/lib/progress/stats';
import { kgToDisplay, volumeLabel } from '@/lib/units';
import { formatElapsedDuration } from '@/hooks/useWorkoutTimer';
import { resolveUnitPreference } from '@/lib/profile/unitPreference';
import { getSupabaseErrorMessage } from '@/lib/supabase/errors';

export default function HistoryScreen() {
  const { weekStart, weekEnd, weekLabel } = useLocalSearchParams<{
    weekStart?: string;
    weekEnd?: string;
    weekLabel?: string;
  }>();
  const {
    data: workouts,
    isLoading,
    isError,
    error,
    refetch,
  } = useWorkoutHistory();
  const { data: profile } = useProfile();
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (weekStart) {
      setSelectedDate(null);
      setMonth(parseISO(weekStart));
    }
  }, [weekStart]);

  const unit = resolveUnitPreference(profile?.unit_preference);
  const trainingDays = useMemo(
    () => getTrainingDayKeys(workouts ?? []),
    [workouts],
  );

  const listData = useMemo(() => {
    if (!workouts) return [];

    if (weekStart && weekEnd) {
      const start = parseISO(weekStart);
      const end = parseISO(weekEnd);

      return workouts.filter((workout) => {
        const startedAt = parseISO(workout.started_at);
        return isWithinInterval(startedAt, { start, end });
      });
    }

    if (selectedDate) {
      return workoutsOnDate(workouts, selectedDate);
    }

    return workouts.slice(0, 30);
  }, [workouts, selectedDate, weekStart, weekEnd]);

  if (isLoading) {
    return (
      <Screen className="px-5 pt-5">
        <BackButton className="mb-4" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen className="px-5 pt-5">
        <BackButton className="mb-4" />
        <AppText className="text-3xl" variant="display">
          History
        </AppText>
        <QueryError
          message={getSupabaseErrorMessage(error)}
          onRetry={() => void refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="px-5 pt-5">
        <BackButton className="mb-4" />
      </View>
      <FlatList
        data={listData}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View className="gap-4 pb-4">
            <AppText className="text-3xl" variant="display">
              History
            </AppText>
            <AppText variant="muted">
              Tap a day on the calendar, or browse recent sessions below.
            </AppText>

            {weekStart && weekEnd ? (
              <View className="flex-row items-center justify-between">
                <AppText variant="body">
                  Showing {weekLabel ?? 'selected week'}
                </AppText>
                <Pressable
                  onPress={() =>
                    router.replace({
                      pathname: '/history',
                      params: {},
                    })
                  }
                >
                  <AppText className="text-accent" variant="body">
                    Clear week filter
                  </AppText>
                </Pressable>
              </View>
            ) : null}

            <WorkoutCalendar
              month={month}
              onMonthChange={setMonth}
              onSelectDate={(date) => {
                setSelectedDate((current) =>
                  current && isSameDay(current, date) ? null : date,
                );
              }}
              selectedDate={selectedDate}
              trainingDays={trainingDays}
            />

            <View className="flex-row items-center justify-between">
              <AppText variant="display">
                {weekStart && weekEnd
                  ? `${weekLabel ?? 'Week'} sessions`
                  : selectedDate
                    ? format(selectedDate, 'MMM d, yyyy')
                    : 'Recent sessions'}
              </AppText>
              {selectedDate || weekStart ? (
                <Pressable
                  onPress={() => {
                    if (weekStart) {
                      router.replace({ pathname: '/history', params: {} });
                      return;
                    }

                    setSelectedDate(null);
                  }}
                >
                  <AppText className="text-accent" variant="body">
                    Clear
                  </AppText>
                </Pressable>
              ) : null}
            </View>
          </View>
        }
        contentContainerClassName="px-5 pb-10"
        ItemSeparatorComponent={() => <View className="h-2" />}
        ListEmptyComponent={
          <Card>
            <AppText variant="muted">
              {weekStart && weekEnd
                ? 'No workouts logged during this week.'
                : selectedDate
                  ? 'No workouts logged on this day.'
                  : 'Complete a workout to see it here.'}
            </AppText>
          </Card>
        }
        renderItem={({ item }) => (
          <Pressable
            className="active:opacity-80"
            onPress={() => router.push(`/history/${item.id}`)}
          >
            <Card>
              <AppText variant="display">{item.name}</AppText>
              <AppText className="mt-1" variant="muted">
                {format(parseISO(item.started_at), 'EEEE · h:mm a')}
              </AppText>
              <View className="mt-3 flex-row gap-4">
                <View>
                  <AppText variant="muted">Duration</AppText>
                  <AppText variant="mono">
                    {item.duration_seconds != null
                      ? formatElapsedDuration(item.duration_seconds)
                      : '—'}
                  </AppText>
                </View>
                <View>
                  <AppText variant="muted">Volume</AppText>
                  <AppText variant="mono">
                    {kgToDisplay(item.total_volume, unit)} {volumeLabel(unit)}
                  </AppText>
                </View>
              </View>
            </Card>
          </Pressable>
        )}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}
