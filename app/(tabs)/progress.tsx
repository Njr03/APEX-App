import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { Search, X } from 'lucide-react-native';

import { AllTimePRsPanel } from '@/components/progress/AllTimePRsPanel';
import { BodyweightSection } from '@/components/progress/BodyweightSection';
import { ExerciseProgressCharts } from '@/components/progress/ExerciseProgressCharts';
import { KeyLiftsProgression } from '@/components/progress/KeyLiftsProgression';
import { AppText } from '@/components/ui/AppText';
import { TabPageHeading } from '@/components/ui/TabPageHeading';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { QueryError } from '@/components/ui/QueryState';
import { Screen } from '@/components/ui/Screen';
import {
  useBodyMetrics,
  useExerciseHistory,
  useExercises,
  useProfile,
} from '@/hooks/queries';
import { useProgressPageData } from '@/hooks/useProgressPageData';
import { colors } from '@/constants/theme';
import type { Exercise } from '@/lib/supabase';
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

  const [pickerVisible, setPickerVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null,
  );

  const { data: exercises } = useExercises({
    search: search.trim() || undefined,
  });
  const { data: exerciseHistory, isLoading: historyLoading } =
    useExerciseHistory(selectedExercise?.id);

  const filteredExercises = useMemo(() => exercises ?? [], [exercises]);

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

        <View className="gap-2">
          <AppText variant="display">Exercise progress</AppText>
          <Pressable
            className="rounded-lg border border-border bg-surface px-4 py-3 active:opacity-80"
            onPress={() => setPickerVisible(true)}
          >
            <AppText variant="body">
              {selectedExercise?.name ?? 'Select an exercise'}
            </AppText>
            <AppText className="mt-1" variant="muted">
              Max weight and estimated 1RM trends
            </AppText>
          </Pressable>

          {selectedExercise ? (
            historyLoading ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <ExerciseProgressCharts
                sessions={exerciseHistory?.sessions ?? []}
                unit={unit}
              />
            )
          ) : (
            <Card>
              <AppText variant="muted">
                Pick an exercise to view progression charts.
              </AppText>
            </Card>
          )}
        </View>

        <BodyweightSection metrics={bodyMetrics ?? []} unit={unit} />
      </ScrollView>

      <Modal animationType="slide" transparent visible={pickerVisible}>
        <View className="flex-1 justify-end bg-black/60">
          <View className="max-h-[80%] rounded-t-2xl border border-border bg-bg px-5 pb-8 pt-4">
            <View className="mb-4 flex-row items-center justify-between">
              <AppText className="text-xl" variant="display">
                Select exercise
              </AppText>
              <Pressable onPress={() => setPickerVisible(false)}>
                <X color={colors.text} size={22} />
              </Pressable>
            </View>

            <View className="relative mb-4">
              <Input
                autoCapitalize="none"
                autoCorrect={false}
                className="pl-10"
                onChangeText={setSearch}
                placeholder="Search…"
                value={search}
              />
              <View className="absolute left-3 top-3.5">
                <Search color={colors.muted} size={18} />
              </View>
            </View>

            <ScrollView contentContainerClassName="gap-2 pb-4">
              {filteredExercises.length === 0 ? (
                <AppText className="py-4 text-center" variant="muted">
                  No exercises match your search.
                </AppText>
              ) : (
                filteredExercises.map((exercise) => (
                  <Pressable
                    accessibilityLabel={`Select ${exercise.name}`}
                    accessibilityRole="button"
                    className="rounded-lg border border-border bg-surface px-4 py-3 active:opacity-80"
                    key={exercise.id}
                    onPress={() => {
                      setSelectedExercise(exercise);
                      setPickerVisible(false);
                      setSearch('');
                    }}
                  >
                    <AppText variant="body">{exercise.name}</AppText>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
