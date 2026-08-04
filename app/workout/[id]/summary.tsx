import { Link, useLocalSearchParams, router } from 'expo-router';
import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { Target, Trophy } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';

import { AppText } from '@/components/ui/AppText';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { useProfile, useWorkout, useWorkoutSessionRecords } from '@/hooks/queries';
import { clearActiveWorkoutCache } from '@/hooks/queries/workoutCache';
import { formatElapsedDuration } from '@/hooks/useWorkoutTimer';
import { colors } from '@/constants/theme';
import { formatDashboardPRValue } from '@/lib/dashboard/recentPRs';
import { formatRecordTypeLabel } from '@/lib/personalRecords';
import { resolveUnitPreference } from '@/lib/profile/unitPreference';
import { getSupabaseErrorMessage } from '@/lib/supabase/errors';
import { kgToDisplay, volumeLabel } from '@/lib/units';
import { countWorkoutPRSets } from '@/lib/workout/volume';
import { ROUTINE_TARGET_BONUS_XP } from '@/lib/xp';
import { useAuth } from '@/providers/AuthProvider';

export default function WorkoutSummaryScreen() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { id, xp, prs, routineTarget } = useLocalSearchParams<{
    id: string;
    xp?: string;
    prs?: string;
    routineTarget?: string;
  }>();
  const { data: workout, isLoading, isError, error } = useWorkout(id);
  const { data: profile } = useProfile();

  const unit = resolveUnitPreference(profile?.unit_preference);
  const xpEarned = xp ? parseInt(xp, 10) : 0;
  const hitRoutineTarget = routineTarget === '1';

  const setIds = useMemo(
    () =>
      workout?.workout_exercises.flatMap((we) =>
        (we.sets ?? []).map((set) => set.id),
      ) ?? [],
    [workout?.workout_exercises],
  );

  const { data: sessionRecords = [] } = useWorkoutSessionRecords(setIds);

  const prSetCount = workout
    ? countWorkoutPRSets(workout.workout_exercises)
    : prs
      ? parseInt(prs, 10)
      : 0;
  const recordCount = sessionRecords.length || prSetCount;
  const hasAchievements = recordCount > 0 || hitRoutineTarget;

  const handleDone = () => {
    if (user) {
      clearActiveWorkoutCache(queryClient, user.id);
    }
    router.replace('/(tabs)');
  };

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

  if (isError || !workout) {
    return (
      <Screen className="px-5 pt-5">
        <BackButton className="mb-4" />
        <AppText className="text-accent3" variant="body">
          {getSupabaseErrorMessage(error)}
        </AppText>
        <Button
          className="mt-4"
          label="Go Home"
          onPress={() => router.replace('/(tabs)')}
          variant="secondary"
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 p-5 pb-10"
        showsVerticalScrollIndicator={false}
      >
        <BackButton className="mb-2" />
        <AppText className="text-3xl" variant="display">
          Workout Complete
        </AppText>
        <AppText variant="muted">{workout.name}</AppText>

        <Card className="gap-4">
          <View className="flex-row flex-wrap gap-6">
            <StatBlock
              label="Duration"
              value={
                workout.duration_seconds != null
                  ? formatElapsedDuration(workout.duration_seconds)
                  : '—'
              }
            />
            <StatBlock
              label="Volume"
              value={`${kgToDisplay(workout.total_volume, unit)} ${volumeLabel(unit)}`}
            />
            <StatBlock label="XP" value={`+${xpEarned || 0}`} accent="gold" />
            <StatBlock
              label="Records"
              value={String(recordCount)}
              accent="accent"
            />
          </View>
          {workout.completed_at ? (
            <AppText variant="muted">
              {format(parseISO(workout.completed_at), 'EEEE, MMM d · h:mm a')}
            </AppText>
          ) : null}
        </Card>

        {hasAchievements ? (
          <View className="gap-2">
            <AppText variant="display">Achievements</AppText>

            {hitRoutineTarget ? (
              <Card className="gap-2">
                <View className="flex-row items-center gap-2">
                  <Target color={colors.accent} size={18} />
                  <AppText className="text-accent" variant="body">
                    Workout target hit
                  </AppText>
                </View>
                <AppText variant="muted">
                  You matched your planned volume — +{ROUTINE_TARGET_BONUS_XP} XP
                  bonus
                </AppText>
              </Card>
            ) : null}

            {sessionRecords.length > 0 ? (
              <>
                <View className="mt-1 flex-row items-center gap-2">
                  <Trophy color={colors.gold} size={20} />
                  <AppText variant="body">Personal records</AppText>
                </View>
                {sessionRecords.map((record) => (
                  <Card key={record.id}>
                    <AppText variant="body">{record.exercise.name}</AppText>
                    <AppText className="mt-1 text-gold" variant="mono">
                      {formatRecordTypeLabel(record.record_type)} ·{' '}
                      {formatDashboardPRValue(
                        record.record_type,
                        record.value,
                        unit,
                      )}
                    </AppText>
                  </Card>
                ))}
              </>
            ) : prSetCount > 0 ? (
              <>
                <View className="mt-1 flex-row items-center gap-2">
                  <Trophy color={colors.gold} size={20} />
                  <AppText variant="body">Personal records</AppText>
                </View>
                {workout.workout_exercises.flatMap((we) =>
                  (we.sets ?? [])
                    .filter((set) => set.is_pr && set.completed_at)
                    .map((set) => (
                      <Card key={set.id}>
                        <AppText variant="body">{we.exercise.name}</AppText>
                        <AppText className="mt-1 text-gold" variant="mono">
                          {kgToDisplay(set.weight, unit)} {volumeLabel(unit)} ×{' '}
                          {set.reps} reps
                        </AppText>
                      </Card>
                    )),
                )}
              </>
            ) : null}
          </View>
        ) : null}

        <View className="gap-2">
          <AppText variant="display">Logged</AppText>
          {workout.workout_exercises.map((we) => {
            const completedSets = (we.sets ?? []).filter((s) => s.completed_at);
            if (completedSets.length === 0) return null;

            return (
              <Card key={we.id}>
                <AppText variant="body">{we.exercise.name}</AppText>
                {completedSets.map((set) => (
                  <AppText className="mt-1" key={set.id} variant="mono">
                    Set {set.set_number}: {kgToDisplay(set.weight, unit)}{' '}
                    {volumeLabel(unit)} × {set.reps}
                    {set.is_pr ? ' 🏆' : ''}
                  </AppText>
                ))}
              </Card>
            );
          })}
        </View>

        <Button label="Done" onPress={handleDone} />
        <Link asChild href="/history">
          <Button label="View History" variant="secondary" />
        </Link>
      </ScrollView>
    </Screen>
  );
}

function StatBlock({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: 'gold' | 'accent';
}) {
  const colorClass =
    accent === 'gold'
      ? 'text-gold'
      : accent === 'accent'
        ? 'text-accent'
        : 'text-text';

  return (
    <View>
      <AppText variant="muted">{label}</AppText>
      <AppText className={colorClass} variant="mono">
        {value}
      </AppText>
    </View>
  );
}
