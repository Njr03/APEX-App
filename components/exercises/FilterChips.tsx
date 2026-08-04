import { Pressable, ScrollView, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { cn } from '@/lib/cn';

interface FilterChipsProps<T extends string> {
  label: string;
  options: readonly T[];
  value: T | null;
  onChange: (value: T | null) => void;
  formatLabel?: (value: T) => string;
}

export function FilterChips<T extends string>({
  label,
  options,
  value,
  onChange,
  formatLabel = (v) => v.replace(/_/g, ' '),
}: FilterChipsProps<T>) {
  return (
    <View className="gap-2">
      <AppText className="text-xs uppercase tracking-wide" variant="muted">
        {label}
      </AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 pr-2"
      >
        <Chip
          active={value === null}
          label="All"
          onPress={() => onChange(null)}
        />
        {options.map((option) => (
          <Chip
            active={value === option}
            key={option}
            label={formatLabel(option)}
            onPress={() => onChange(value === option ? null : option)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      className={cn(
        'rounded-full border px-3 py-1.5 capitalize active:opacity-80',
        active
          ? 'border-accent bg-accent/15'
          : 'border-border bg-surface2',
      )}
      onPress={onPress}
    >
      <AppText
        className={cn('text-sm', active ? 'text-accent' : 'text-text')}
        variant="body"
      >
        {label}
      </AppText>
    </Pressable>
  );
}
