import { Link, router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { format, parseISO } from 'date-fns';
import { Plus } from 'lucide-react-native';

import { AppText } from '@/components/ui/AppText';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { useRoutineSummaries } from '@/hooks/queries';
import { colors } from '@/constants/theme';
import { getSupabaseErrorMessage } from '@/lib/supabase/errors';

export default function RoutinesScreen() {
  const { data: routines, isLoading, isError, error, refetch } =
    useRoutineSummaries();

  return (
    <Screen>
      <View className="flex-1 px-5 pt-5">
        <BackButton className="mb-4" />
        <View className="mb-4 flex-row items-center justify-between">
          <AppText className="text-3xl" variant="display">
            Workouts
          </AppText>
          <Pressable
            accessibilityLabel="Create workout"
            accessibilityRole="button"
            className="rounded-full bg-accent p-2 active:opacity-80"
            onPress={() => router.push('/routines/new')}
          >
            <Plus color={colors.bg} size={22} />
          </Pressable>
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.accent} />
        ) : null}

        {isError ? (
          <View className="gap-3">
            <AppText className="text-accent3" variant="body">
              {getSupabaseErrorMessage(error)}
            </AppText>
            <Button label="Retry" onPress={() => refetch()} variant="secondary" />
          </View>
        ) : null}

        {!isLoading && !isError ? (
          <FlatList
            data={routines ?? []}
            keyExtractor={(item) => item.id}
            contentContainerClassName="gap-3 pb-10"
            ListEmptyComponent={
              <Card>
                <AppText variant="muted">
                  No workouts yet. Build a template to pre-fill your sessions.
                </AppText>
                <Button
                  className="mt-4"
                  label="Create Workout"
                  onPress={() => router.push('/routines/new')}
                />
              </Card>
            }
            renderItem={({ item }) => (
              <Link asChild href={`/routines/${item.id}`}>
                <Pressable className="active:opacity-80">
                  <Card>
                    <AppText variant="display">{item.name}</AppText>
                    {item.description ? (
                      <AppText className="mt-1" numberOfLines={2} variant="muted">
                        {item.description}
                      </AppText>
                    ) : null}
                    <View className="mt-3 flex-row gap-4">
                      <View>
                        <AppText variant="muted">Exercises</AppText>
                        <AppText variant="mono">{item.exercise_count}</AppText>
                      </View>
                      <View>
                        <AppText variant="muted">Last used</AppText>
                        <AppText variant="mono">
                          {item.last_used_at
                            ? format(parseISO(item.last_used_at), 'MMM d')
                            : 'Never'}
                        </AppText>
                      </View>
                    </View>
                  </Card>
                </Pressable>
              </Link>
            )}
            showsVerticalScrollIndicator={false}
          />
        ) : null}
      </View>
    </Screen>
  );
}
