import { ActivityIndicator, ScrollView, View } from 'react-native';

import { RecentPersonalRecordsPanel } from '@/components/dashboard/RecentPersonalRecordsPanel';
import { SplitCardsRow } from '@/components/dashboard/ThisWeekSection';
import { StatTilesRow } from '@/components/dashboard/StatTilesRow';
import { TrainingInsightsSection } from '@/components/dashboard/TrainingInsightsSection';
import { QueryError } from '@/components/ui/QueryState';
import { TabScreen as Screen } from '@/components/navigation/TabScreen';
import { useProfile } from '@/hooks/queries';
import { useAutoSeedDemoData } from '@/hooks/useAutoSeedDemoData';
import { useRefreshDashboardOnFocus } from '@/hooks/useRefreshDashboardOnFocus';
import { useTabScrollViewToTop } from '@/hooks/useTabScrollToTop';
import { colors } from '@/constants/theme';
import { resolveUnitPreference } from '@/lib/profile/unitPreference';
import { getSupabaseErrorMessage } from '@/lib/supabase/errors';

export default function HomeScreen() {
  const scrollRef = useTabScrollViewToTop('index');
  const {
    data: profile,
    isLoading: isProfileLoading,
    isError: isProfileError,
    error: profileError,
    refetch: refetchProfile,
  } = useProfile();

  const unit = resolveUnitPreference(profile?.unit_preference);

  useAutoSeedDemoData();
  useRefreshDashboardOnFocus();

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerClassName="gap-4 p-5 pb-10"
        showsVerticalScrollIndicator={false}
      >
        <SplitCardsRow unit={unit} />

        <StatTilesRow unit={unit} />

        <TrainingInsightsSection unit={unit} />

        <View style={{ marginTop: 4 }}>
          <RecentPersonalRecordsPanel unit={unit} />
        </View>

        {isProfileLoading ? (
          <ActivityIndicator color={colors.accent} />
        ) : isProfileError ? (
          <QueryError
            message={getSupabaseErrorMessage(profileError)}
            onRetry={() => void refetchProfile()}
          />
        ) : null}
      </ScrollView>
    </Screen>
  );
}
