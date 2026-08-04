import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { WorkoutSessionDetail } from '@/components/workout/WorkoutSessionDetail';
import { AppText } from '@/components/ui/AppText';
import { BackButton } from '@/components/ui/BackButton';
import { Screen } from '@/components/ui/Screen';
import { useProfile, useWorkout } from '@/hooks/queries';
import { colors } from '@/constants/theme';
import { resolveUnitPreference } from '@/lib/profile/unitPreference';
import { getSupabaseErrorMessage } from '@/lib/supabase/errors';

export default function HistoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: workout, isLoading, isError, error } = useWorkout(id);
  const { data: profile } = useProfile();

  const unit = resolveUnitPreference(profile?.unit_preference);

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
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="px-5 pt-4">
        <BackButton />
      </View>
      <WorkoutSessionDetail
        title="Session Detail"
        unit={unit}
        workout={workout}
      />
    </Screen>
  );
}
