import { Pressable, type PressableProps } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends PressableProps {
  label: string;
  variant?: ButtonVariant;
  className?: string;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-accent',
  secondary: 'bg-surface2 border border-border',
  ghost: 'bg-transparent',
  danger: 'bg-accent3/20 border border-accent3/40',
};

const labelStyles: Record<ButtonVariant, string> = {
  primary: 'text-bg font-body font-semibold',
  secondary: 'text-text',
  ghost: 'text-accent',
  danger: 'text-accent3',
};

export function Button({
  label,
  variant = 'primary',
  className,
  loading = false,
  disabled,
  accessibilityLabel,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      className={cn(
        'min-h-12 items-center justify-center rounded-lg px-5 py-3 active:opacity-80',
        variantStyles[variant],
        isDisabled && 'opacity-50',
        className,
      )}
      disabled={isDisabled}
      {...props}
    >
      <AppText className={labelStyles[variant]} variant="body">
        {loading ? 'Loading…' : label}
      </AppText>
    </Pressable>
  );
}
