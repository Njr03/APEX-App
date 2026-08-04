import { forwardRef } from 'react';
import { TextInput, type TextInputProps } from 'react-native';

import { fonts } from '@/constants/theme';
import { cn } from '@/lib/cn';

interface InputProps extends TextInputProps {
  className?: string;
  hasError?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { className, hasError = false, style, ...props },
  ref,
) {
  return (
    <TextInput
      ref={ref}
      placeholderTextColor="rgba(240,237,232,0.35)"
      className={cn(
        'min-h-12 rounded-lg border bg-surface2 px-4 text-base text-text',
        hasError ? 'border-accent3' : 'border-border',
        className,
      )}
      style={[{ fontFamily: fonts.body }, style]}
      {...props}
    />
  );
});
