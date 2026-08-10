import { forwardRef } from 'react';
import { TextInput, type TextInputProps } from 'react-native';

import { fonts, APP_TEXT_TRANSFORM } from '@/constants/theme';
import { cn } from '@/lib/cn';
import {
  handleNumericInputBlur,
  WEB_NUMERIC_INPUT_FONT_SIZE,
} from '@/lib/ui/viewportZoom';

interface NumericInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  className?: string;
  value: string;
  onChangeText: (value: string) => void;
  completed?: boolean;
}

export const NumericInput = forwardRef<TextInput, NumericInputProps>(
  function NumericInput(
    { className, completed = false, style, onBlur, ...props },
    ref,
  ) {
    return (
      <TextInput
        ref={ref}
        keyboardType="decimal-pad"
        placeholderTextColor="rgba(240,237,232,0.35)"
        className={cn(
          'min-h-10 rounded-md border px-2 py-2 text-center text-sm text-text',
          completed
            ? 'border-accent/40 bg-accent/10'
            : 'border-border bg-surface2',
          className,
        )}
        onBlur={handleNumericInputBlur(onBlur)}
        style={[
          { fontFamily: fonts.mono, minWidth: 56 },
          WEB_NUMERIC_INPUT_FONT_SIZE != null
            ? { fontSize: WEB_NUMERIC_INPUT_FONT_SIZE }
            : null,
          APP_TEXT_TRANSFORM,
          style,
        ]}
        {...props}
      />
    );
  },
);
