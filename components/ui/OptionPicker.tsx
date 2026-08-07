import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { cn } from '@/lib/cn';

interface OptionPickerProps<T extends string> {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  formatLabel?: (value: T) => string;
  error?: string;
  /** Match FilterChips section labels (e.g. Muscle group on Lifts tab). */
  sectionLabel?: boolean;
}

export function OptionPicker<T extends string>({
  label,
  options,
  value,
  onChange,
  formatLabel = (v) => v.replace(/_/g, ' '),
  error,
  sectionLabel = false,
}: OptionPickerProps<T>) {
  return (
    <View className="gap-2">
      <AppText
        className={sectionLabel ? 'text-xs uppercase tracking-wide' : 'text-sm'}
        variant={sectionLabel ? 'muted' : 'body'}
      >
        {label}
      </AppText>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const active = option === value;
          return (
            <Pressable
              key={option}
              accessibilityLabel={`${label}: ${formatLabel(option)}`}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              className={cn(
                'rounded-lg border px-3 py-2 capitalize active:opacity-80',
                active
                  ? 'border-accent bg-accent/15'
                  : 'border-border bg-surface2',
              )}
              onPress={() => onChange(option)}
            >
              <AppText
                className={cn('text-sm', active ? 'text-accent' : 'text-text')}
                variant="body"
              >
                {formatLabel(option)}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <AppText className="text-sm text-accent3" variant="body">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
