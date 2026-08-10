import { GripVertical, Trash2 } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { NumericInput } from '@/components/ui/NumericInput';
import { colors } from '@/constants/theme';
import type { Exercise } from '@/lib/supabase';

export interface RoutineBuilderItem {
  key: string;
  exercise_id: string;
  exercise: Exercise;
  target_sets: string;
  target_reps: string;
  target_weight: string;
}

interface RoutineExerciseRowProps {
  item: RoutineBuilderItem;
  unit: 'kg' | 'lb';
  drag: () => void;
  isActive: boolean;
  onChange: (items: RoutineBuilderItem[]) => void;
  onRemove: (key: string) => void;
  allItems: RoutineBuilderItem[];
}

export function RoutineExerciseRow({
  item,
  unit,
  drag,
  isActive,
  onChange,
  onRemove,
  allItems,
}: RoutineExerciseRowProps) {
  function updateItem(
    key: string,
    patch: Partial<
      Pick<RoutineBuilderItem, 'target_sets' | 'target_reps' | 'target_weight'>
    >,
  ) {
    onChange(
      allItems.map((entry) => (entry.key === key ? { ...entry, ...patch } : entry)),
    );
  }

  return (
    <View
      className={`mb-3 rounded-lg border border-border bg-surface p-3 ${
        isActive ? 'opacity-90' : ''
      }`}
    >
      <View className="mb-3 flex-row items-center gap-2">
        <Pressable
          accessibilityLabel="Drag to reorder"
          accessibilityRole="button"
          className="p-1"
          delayLongPress={100}
          onLongPress={drag}
        >
          <GripVertical color={colors.muted} size={20} />
        </Pressable>
        <View className="flex-1">
          <AppText variant="display">{item.exercise.name}</AppText>
          <AppText className="capitalize" variant="muted">
            {item.exercise.muscle_group.replace('_', ' ')}
          </AppText>
        </View>
        <Pressable
          accessibilityLabel="Remove exercise"
          accessibilityRole="button"
          className="p-2"
          onPress={() => onRemove(item.key)}
        >
          <Trash2 color={colors.accent3} size={18} />
        </Pressable>
      </View>

      <View className="flex-row gap-2">
        <View className="flex-1 gap-1">
          <AppText className="text-xs" variant="muted">
            Sets
          </AppText>
          <NumericInput
            keyboardType="number-pad"
            onChangeText={(value) => updateItem(item.key, { target_sets: value })}
            placeholder="3"
            value={item.target_sets}
          />
        </View>
        <View className="flex-1 gap-1">
          <AppText className="text-xs" variant="muted">
            Reps
          </AppText>
          <NumericInput
            keyboardType="number-pad"
            onChangeText={(value) => updateItem(item.key, { target_reps: value })}
            placeholder="8"
            value={item.target_reps}
          />
        </View>
        <View className="flex-1 gap-1">
          <AppText className="text-xs" variant="muted">
            {unit}
          </AppText>
          <NumericInput
            onChangeText={(value) => updateItem(item.key, { target_weight: value })}
            placeholder="0"
            value={item.target_weight}
          />
        </View>
      </View>
    </View>
  );
}

/** @deprecated Use RoutineExerciseRow inside a screen-level DraggableFlatList. */
export function RoutineExerciseList({
  items,
  unit,
  onChange,
  onRemove,
}: {
  items: RoutineBuilderItem[];
  unit: 'kg' | 'lb';
  onChange: (items: RoutineBuilderItem[]) => void;
  onRemove: (key: string) => void;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <>
      {items.map((item) => (
        <RoutineExerciseRow
          key={item.key}
          allItems={items}
          drag={() => undefined}
          isActive={false}
          item={item}
          onChange={onChange}
          onRemove={onRemove}
          unit={unit}
        />
      ))}
    </>
  );
}
