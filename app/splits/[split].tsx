import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { format, parseISO } from 'date-fns';

import { BackButton } from '@/components/ui/BackButton';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { QueryError } from '@/components/ui/QueryState';
import { Screen } from '@/components/ui/Screen';
import { useThisWeekSplits } from '@/hooks/useThisWeekSplits';
import { useProfile } from '@/hooks/queries';
import {
  formatPrCount,
  formatSplitDay,
  formatSplitDuration,
  formatSplitVolume,
} from '@/lib/training/weekSplits';
import {
  SPLIT_DEFINITIONS,
  type TrainingSplit,
} from '@/lib/training/splits';
import { colors } from '@/constants/theme';
import { resolveUnitPreference } from '@/lib/profile/unitPreference';
import { getSupabaseErrorMessage } from '@/lib/supabase/errors';

export default function SplitDetailScreen() {
  const { split } = useLocalSearchParams<{ split: string }>();
  const splitId = (split?.toUpperCase() ?? 'A') as TrainingSplit;
  const definition =
    SPLIT_DEFINITIONS[splitId in SPLIT_DEFINITIONS ? splitId : 'A'];
  const { data: profile } = useProfile();
  const { data, isLoading, isError, error, refetch } = useThisWeekSplits();
  const unit = resolveUnitPreference(profile?.unit_preference);

  const card = data?.cards.find((item) => item.definition.id === definition.id);
  const session = card?.completedSession ?? card?.lastSession;

  if (isLoading) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator color={colors.accent} size="large" />
      </Screen>
    );
  }

  if (isError || !card) {
    return (
      <Screen className="px-5 pt-5">
        <BackButton className="mb-4" />
        <QueryError
          message={getSupabaseErrorMessage(error)}
          onRetry={() => void refetch()}
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

        <View>
          <AppText
            className="text-xs uppercase tracking-[2px]"
            style={{ color: definition.color }}
            variant="mono"
          >
            {definition.eyebrow}
          </AppText>
          <AppText className="mt-1 text-3xl" variant="display">
            {definition.name}
          </AppText>
          <AppText className="mt-2" variant="muted">
            {definition.muscles}
          </AppText>
        </View>

        <Card className="gap-3">
          <AppText variant="muted">Status</AppText>
          <AppText style={{ color: definition.color }} variant="display">
            {card.status === 'completed'
              ? 'Completed this week'
              : card.status === 'today'
                ? 'Scheduled today'
                : 'Upcoming'}
          </AppText>
        </Card>

        {session ? (
          <Card className="gap-3">
            <AppText variant="muted">
              {card.completedSession ? 'This week session' : 'Last session'}
            </AppText>
            <AppText variant="body">
              {formatSplitDay(session.startedAt)} ·{' '}
              {format(parseISO(session.startedAt), 'MMM d, yyyy')}
            </AppText>
            <AppText style={{ color: definition.color }} variant="mono">
              {formatSplitVolume(session.totalVolume, unit)}
            </AppText>
            <AppText variant="mono">
              {formatSplitDuration(session.durationSeconds)}
            </AppText>
            {session.prCount > 0 ? (
              <AppText className="text-gold" variant="mono">
                {formatPrCount(session.prCount)}
              </AppText>
            ) : null}
          </Card>
        ) : (
          <Card>
            <AppText variant="muted">
              No logged session for this split yet.
            </AppText>
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}
