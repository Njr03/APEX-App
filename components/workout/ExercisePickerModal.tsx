import { Modal, Pressable, View, FlatList, ActivityIndicator } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';

import { AppText } from '@/components/ui/AppText';
import { Input } from '@/components/ui/Input';
import { useExercises } from '@/hooks/queries';
import { colors } from '@/constants/theme';
import type { Exercise } from '@/lib/supabase';
import { getSupabaseErrorMessage } from '@/lib/supabase/errors';

interface ExercisePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
  excludeExerciseIds?: string[];
}

export function ExercisePickerModal({
  visible,
  onClose,
  onSelect,
  excludeExerciseIds = [],
}: ExercisePickerModalProps) {
  const [search, setSearch] = useState('');
  const { data: exercises, isLoading, isError, error } = useExercises({
    search: search.trim() || undefined,
  });

  const filtered = useMemo(() => {
    const excluded = new Set(excludeExerciseIds);
    return (exercises ?? []).filter((exercise) => !excluded.has(exercise.id));
  }, [exercises, excludeExerciseIds]);

  return (
    <Modal animationType="slide" transparent visible={visible}>
      <View className="flex-1 justify-end bg-black/60">
        <View className="max-h-[85%] rounded-t-2xl border border-border bg-bg px-5 pb-8 pt-4">
          <View className="mb-4 flex-row items-center justify-between">
            <AppText className="text-xl" variant="display">
              Add Exercise
            </AppText>
            <Pressable
              accessibilityLabel="Close exercise picker"
              accessibilityRole="button"
              className="rounded-full p-2 active:opacity-70"
              onPress={onClose}
            >
              <X color={colors.text} size={22} />
            </Pressable>
          </View>

          <View className="relative mb-4">
            <Input
              autoCapitalize="none"
              autoCorrect={false}
              className="pl-10"
              onChangeText={setSearch}
              placeholder="Search exercises…"
              value={search}
            />
            <View className="absolute left-3 top-3.5">
              <Search color={colors.muted} size={18} />
            </View>
          </View>

          {isLoading ? (
            <ActivityIndicator color={colors.accent} />
          ) : null}

          {isError ? (
            <AppText className="text-accent3" variant="body">
              {getSupabaseErrorMessage(error)}
            </AppText>
          ) : null}

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerClassName="gap-2 pb-4"
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              !isLoading ? (
                <AppText variant="muted">No exercises match your search.</AppText>
              ) : null
            }
            renderItem={({ item }) => (
              <Pressable
                className="rounded-lg border border-border bg-surface px-4 py-3 active:opacity-80"
                onPress={() => {
                  onSelect(item);
                  onClose();
                  setSearch('');
                }}
              >
                <AppText variant="body">{item.name}</AppText>
                <AppText className="mt-1 capitalize" variant="muted">
                  {item.muscle_group.replace('_', ' ')}
                </AppText>
              </Pressable>
            )}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );
}
