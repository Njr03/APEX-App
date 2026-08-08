import { Link, useLocalSearchParams, router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { format, parseISO } from 'date-fns';

import { AppText } from '@/components/ui/AppText';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { TabPageHeading } from '@/components/ui/TabPageHeading';
import { useProfile, useWorkout } from '@/hooks/queries';
import { clearActiveWorkoutCache, invalidateDashboardMetrics } from '@/hooks/queries/workoutCache';
import { formatElapsedDuration } from '@/hooks/useWorkoutTimer';
import { colors } from '@/constants/theme';
import { resolveUnitPreference } from '@/lib/profile/unitPreference';
import { getSupabaseErrorMessage } from '@/lib/supabase/errors';
import { kgToDisplay, volumeLabel } from '@/lib/units';
import { countWorkoutPRSets } from '@/lib/workout/volume';
import { useAuth } from '@/providers/AuthProvider';

export default function WorkoutSummaryScreen() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { id, prs } = useLocalSearchParams<{
    id: string;
    prs?: string;
  }>();
  const { data: workout, isLoading, isError, error } = useWorkout(id);
  const { data: profile } = useProfile();

  const unit = resolveUnitPreference(profile?.unit_preference);

  const prCount = workout
    ? countWorkoutPRSets(workout.workout_exercises)
    : prs
      ? parseInt(prs, 10)
      : 0;

  const handleDone = () => {
    if (user) {
      clearActiveWorkoutCache(queryClient, user.id);
      void invalidateDashboardMetrics(queryClient, user.id);
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
        <TabPageHeading title="Workout Complete" />
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
            <StatBlock
              accent="accent"
              label="PRs"
              value={String(prCount)}
            />
          </View>
          {workout.completed_at ? (
            <AppText variant="muted">
              {format(parseISO(workout.completed_at), 'EEEE, MMM d · h:mm a')}
            </AppText>
          ) : null}
        </Card>

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
  accent?: 'accent';
}) {
  return (
    <View>
      <AppText variant="muted">{label}</AppText>
      <AppText
        className={accent === 'accent' ? 'text-accent' : 'text-text'}
        variant="mono"
      >
        {value}
      </AppText>
    </View>
  );
}
