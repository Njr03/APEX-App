import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';

import { FilterChips } from '@/components/exercises/FilterChips';
import { AppText } from '@/components/ui/AppText';
import { Input } from '@/components/ui/Input';
import { TabPageHeading } from '@/components/ui/TabPageHeading';
import { useExercises } from '@/hooks/queries';
import { MUSCLE_GROUPS, type MuscleGroup } from '@/lib/constants/training';
import { colors } from '@/constants/theme';
import type { Exercise } from '@/lib/supabase';
import { getSupabaseErrorMessage } from '@/lib/supabase/errors';

interface ExercisePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
  excludeExerciseIds?: string[];
  title?: string;
  titleStyle?: 'display' | 'section';
}

export function ExercisePickerModal({
  visible,
  onClose,
  onSelect,
  excludeExerciseIds = [],
  title = 'Add Exercise',
  titleStyle = 'display',
}: ExercisePickerModalProps) {
  const [search, setSearch] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | null>(null);

  useEffect(() => {
    if (!visible) {
      setSearch('');
      setMuscleGroup(null);
    }
  }, [visible]);

  const filters = useMemo(
    () => ({
      search: search.trim() || undefined,
      muscleGroup: muscleGroup ?? undefined,
    }),
    [muscleGroup, search],
  );

  const { data: exercises, isLoading, isError, error } = useExercises(filters);

  const filtered = useMemo(() => {
    const excluded = new Set(excludeExerciseIds);
    return (exercises ?? []).filter((exercise) => !excluded.has(exercise.id));
  }, [exercises, excludeExerciseIds]);

  const handleSelect = (exercise: Exercise) => {
    onSelect(exercise);
    onClose();
    setSearch('');
    setMuscleGroup(null);
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      transparent
      visible={visible}
    >
      <View style={styles.root}>
        <Pressable
          accessibilityLabel="Close exercise picker"
          accessibilityRole="button"
          onPress={onClose}
          style={styles.backdrop}
        />

        <View style={styles.sheet}>
          <View className="mb-4 flex-row items-center justify-between">
            {titleStyle === 'section' ? (
              <TabPageHeading title={title} />
            ) : (
              <AppText className="text-xl" variant="display">
                {title}
              </AppText>
            )}
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
              blurOnSubmit={false}
              className="pl-10"
              onChangeText={setSearch}
              onSubmitEditing={() => {}}
              placeholder="Search by name or muscle group…"
              returnKeyType="search"
              value={search}
            />
            <View className="absolute left-3 top-3.5" pointerEvents="none">
              <Search color={colors.muted} size={18} />
            </View>
          </View>

          <View className="mb-3">
            <FilterChips
              label="Muscle group"
              onChange={setMuscleGroup}
              options={MUSCLE_GROUPS}
              value={muscleGroup}
            />
          </View>

          {isLoading ? <ActivityIndicator color={colors.accent} style={{ marginTop: 12 }} /> : null}

          {isError ? (
            <AppText className="text-accent3" variant="body">
              {getSupabaseErrorMessage(error)}
            </AppText>
          ) : null}

          <FlatList
            contentContainerClassName="gap-2 pb-4 pt-3"
            data={filtered}
            keyboardShouldPersistTaps="always"
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              !isLoading ? (
                <AppText variant="muted">
                  No exercises match your search or muscle group filter.
                </AppText>
              ) : null
            }
            nestedScrollEnabled
            renderItem={({ item }) => (
              <Pressable
                className="rounded-lg border border-border bg-surface px-4 py-3 active:opacity-80"
                onPress={() => handleSelect(item)}
              >
                <AppText variant="body">{item.name}</AppText>
                <AppText className="mt-1 capitalize" variant="muted">
                  {item.muscle_group.replace('_', ' ')}
                </AppText>
              </Pressable>
            )}
            showsVerticalScrollIndicator={false}
            style={styles.list}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    maxHeight: '85%',
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 16,
    zIndex: 1,
  },
  list: {
    flexGrow: 0,
    maxHeight: Platform.OS === 'web' ? 360 : 300,
  },
});
