import { ActivityIndicator, ScrollView, View } from 'react-native';

import { AllTimePRsPanel } from '@/components/progress/AllTimePRsPanel';
import { BodyweightSection } from '@/components/progress/BodyweightSection';
import { KeyLiftsProgression } from '@/components/progress/KeyLiftsProgression';
import { TabPageHeading } from '@/components/ui/TabPageHeading';
import { QueryError } from '@/components/ui/QueryState';
import { Screen } from '@/components/ui/Screen';
import { useBodyMetrics, useProfile } from '@/hooks/queries';
import { useProgressPageData } from '@/hooks/useProgressPageData';
import { colors } from '@/constants/theme';
import { resolveUnitPreference } from '@/lib/profile/unitPreference';
import { getSupabaseErrorMessage } from '@/lib/supabase/errors';

export default function ProgressScreen() {
  const { data: profile } = useProfile();
  const {
    data: progressData,
    isLoading,
    isError,
    error,
    refetch,
  } = useProgressPageData();
  const { data: bodyMetrics } = useBodyMetrics();

  const unit = resolveUnitPreference(profile?.unit_preference);

  if (isLoading) {
    return (
      <Screen className="px-5 pt-5">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </Screen>
    );
  }

  if (isError || !progressData) {
    return (
      <Screen className="px-5 pt-5">
        <TabPageHeading title="Progress" />
        <QueryError
          message={getSupabaseErrorMessage(error)}
          onRetry={() => void refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 p-5 pb-10"
        showsVerticalScrollIndicator={false}
      >
        <TabPageHeading title="Progress" />

        <KeyLiftsProgression rows={progressData.keyLifts} />

        <AllTimePRsPanel records={progressData.allTimePrs} />

        <BodyweightSection metrics={bodyMetrics ?? []} unit={unit} />
      </ScrollView>
    </Screen>
  );
}
