import { Link, router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  View,
} from 'react-native';
import { Pencil, Search, Trash2 } from 'lucide-react-native';

import { FilterChips } from '@/components/exercises/FilterChips';
import { AppText } from '@/components/ui/AppText';
import { TabPageHeading } from '@/components/ui/TabPageHeading';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { useDeleteExercise, useExercises } from '@/hooks/queries';
import { useTabFlatListScrollToTop } from '@/hooks/useTabScrollToTop';
import {
  EQUIPMENT_TYPES,
  MUSCLE_GROUPS,
  type EquipmentType,
  type MuscleGroup,
} from '@/lib/constants/training';
import { confirmDestructiveAction } from '@/lib/confirmAction';
import { colors, fonts } from '@/constants/theme';
import type { Exercise } from '@/lib/supabase';
import { getSupabaseErrorMessage } from '@/lib/supabase/errors';

const BORDER = 'rgba(255,255,255,0.06)';
const MUTED = 'rgba(240,237,232,0.5)';

function CustomExerciseActions({
  exercise,
  isDeleting,
  onDelete,
}: {
  exercise: Exercise;
  isDeleting: boolean;
  onDelete: () => void;
}) {
  if (!exercise.is_custom) return null;

  return (
    <View className="flex-row items-center" style={{ gap: 4, paddingRight: 10 }}>
      <Pressable
        accessibilityLabel={`Edit ${exercise.name}`}
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => router.push(`/exercises/${exercise.id}/edit`)}
        style={{
          alignItems: 'center',
          borderColor: BORDER,
          borderRadius: 8,
          borderWidth: 1,
          height: 28,
          justifyContent: 'center',
          width: 28,
        }}
      >
        <Pencil color={MUTED} size={14} />
      </Pressable>
      <Pressable
        accessibilityLabel={`Delete ${exercise.name}`}
        accessibilityRole="button"
        disabled={isDeleting}
        hitSlop={8}
        onPress={onDelete}
        style={{
          alignItems: 'center',
          borderColor: 'rgba(255,107,107,0.25)',
          borderRadius: 8,
          borderWidth: 1,
          height: 28,
          justifyContent: 'center',
          opacity: isDeleting ? 0.5 : 1,
          width: 28,
        }}
      >
        <Trash2 color={colors.accent3} size={14} />
      </Pressable>
    </View>
  );
}

interface ExerciseListHeaderProps {
  actionError: string | null;
  equipment: EquipmentType | null;
  exerciseCount: number;
  isError: boolean;
  isLoading: boolean;
  muscleGroup: MuscleGroup | null;
  onEquipmentChange: (value: EquipmentType | null) => void;
  onMuscleGroupChange: (value: MuscleGroup | null) => void;
  onRetry: () => void;
  onSearchChange: (value: string) => void;
  queryError: string | undefined;
  search: string;
}

function ExerciseListHeader({
  actionError,
  equipment,
  exerciseCount,
  isError,
  isLoading,
  muscleGroup,
  onEquipmentChange,
  onMuscleGroupChange,
  onRetry,
  onSearchChange,
  queryError,
  search,
}: ExerciseListHeaderProps) {
  return (
    <View className="gap-4 pb-4">
      <View>
        <TabPageHeading title="Exercise Library" />
        <AppText className="mt-2" variant="muted">
          {isLoading ? 'Loading exercises…' : `${exerciseCount} movements`}
        </AppText>
      </View>

      <View className="relative">
        <Input
          autoCapitalize="none"
          autoCorrect={false}
          className="pl-10"
          onChangeText={onSearchChange}
          placeholder="Search exercises…"
          value={search}
        />
        <View className="absolute left-3 top-3.5">
          <Search color={colors.muted} size={18} />
        </View>
      </View>

      <FilterChips
        label="Muscle group"
        onChange={onMuscleGroupChange}
        options={MUSCLE_GROUPS}
        value={muscleGroup}
      />

      <FilterChips
        label="Equipment"
        onChange={onEquipmentChange}
        options={EQUIPMENT_TYPES}
        value={equipment}
      />

      <Link asChild href="/exercises/new">
        <Button label="Add Custom Exercise" variant="secondary" />
      </Link>

      {actionError ? (
        <AppText className="text-accent3" variant="body">
          {actionError}
        </AppText>
      ) : null}

      {isLoading ? <ActivityIndicator color={colors.accent} /> : null}

      {isError ? (
        <View className="gap-3">
          <AppText className="text-accent3" variant="body">
            {queryError}
          </AppText>
          <Button label="Retry" onPress={onRetry} variant="secondary" />
        </View>
      ) : null}
    </View>
  );
}

export default function ExercisesTabScreen() {
  const scrollRef = useTabFlatListScrollToTop<Exercise>('exercises');
  const [search, setSearch] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | null>(null);
  const [equipment, setEquipment] = useState<EquipmentType | null>(null);
  const [deletingExerciseId, setDeletingExerciseId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const deleteExercise = useDeleteExercise();

  const filters = useMemo(
    () => ({
      search: search.trim() || undefined,
      muscleGroup: muscleGroup ?? undefined,
      equipment: equipment ?? undefined,
    }),
    [search, muscleGroup, equipment],
  );

  const { data: exercises, isLoading, isError, error, refetch } =
    useExercises(filters);

  const handleDelete = (exercise: Exercise) => {
    confirmDestructiveAction({
      message: `Remove "${exercise.name}" from your library?`,
      onConfirm: () => {
        setActionError(null);
        setDeletingExerciseId(exercise.id);

        deleteExercise
          .mutateAsync(exercise.id)
          .catch((err) => {
            setActionError(getSupabaseErrorMessage(err));
          })
          .finally(() => {
            setDeletingExerciseId(null);
          });
      },
      title: 'Delete exercise',
    });
  };

  const listHeader = useMemo(
    () => (
      <ExerciseListHeader
        actionError={actionError}
        equipment={equipment}
        exerciseCount={exercises?.length ?? 0}
        isError={isError}
        isLoading={isLoading}
        muscleGroup={muscleGroup}
        onEquipmentChange={setEquipment}
        onMuscleGroupChange={setMuscleGroup}
        onRetry={() => void refetch()}
        onSearchChange={setSearch}
        queryError={getSupabaseErrorMessage(error)}
        search={search}
      />
    ),
    [
      actionError,
      equipment,
      error,
      exercises?.length,
      isError,
      isLoading,
      muscleGroup,
      refetch,
      search,
    ],
  );

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <FlatList
        ref={scrollRef}
        className="flex-1 px-5 pt-5"
        contentContainerClassName="gap-2 pb-10"
        data={!isLoading && !isError ? (exercises ?? []) : []}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          !isLoading && !isError ? (
            <AppText className="mt-2" variant="muted">
              No exercises match your filters.
            </AppText>
          ) : null
        }
        ListHeaderComponent={listHeader}
        renderItem={({ item }) => (
          <View className="flex-row items-center rounded-lg border border-border bg-surface">
            <Link asChild href={`/exercises/${item.id}`} style={{ flex: 1 }}>
              <Pressable className="flex-1 px-4 py-3 active:opacity-80">
                <View className="flex-row items-center justify-between" style={{ gap: 8 }}>
                  <View className="flex-1">
                    <AppText variant="body">{item.name}</AppText>
                    <AppText className="mt-1 capitalize" variant="muted">
                      {item.muscle_group.replace('_', ' ')}
                      {item.equipment ? ` · ${item.equipment}` : ''}
                    </AppText>
                  </View>
                  {item.is_custom ? (
                    <AppText
                      style={{
                        color: colors.accent,
                        fontFamily: fonts.jetbrainsMono,
                        fontSize: 10,
                      }}
                    >
                      Custom
                    </AppText>
                  ) : null}
                </View>
              </Pressable>
            </Link>
            <CustomExerciseActions
              exercise={item}
              isDeleting={deletingExerciseId === item.id}
              onDelete={() => handleDelete(item)}
            />
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}
