import { ActivityIndicator, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/theme';

interface QueryLoadingProps {
  label?: string;
  className?: string;
}

export function QueryLoading({
  label = 'Loading…',
  className,
}: QueryLoadingProps) {
  return (
    <View className={`items-center justify-center gap-3 py-8 ${className ?? ''}`}>
      <ActivityIndicator accessibilityLabel={label} color={colors.accent} size="large" />
      <AppText variant="muted">{label}</AppText>
    </View>
  );
}

interface QueryErrorProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function QueryError({
  message,
  onRetry,
  retryLabel = 'Try again',
  className,
}: QueryErrorProps) {
  return (
    <View className={`gap-3 py-4 ${className ?? ''}`}>
      <AppText accessibilityRole="alert" className="text-accent3" variant="body">
        {message}
      </AppText>
      {onRetry ? (
        <Button label={retryLabel} onPress={onRetry} variant="secondary" />
      ) : null}
    </View>
  );
}

interface QueryEmptyProps {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function QueryEmpty({
  title,
  message,
  actionLabel,
  onAction,
  className,
}: QueryEmptyProps) {
  return (
    <View className={`gap-3 rounded-lg border border-border bg-surface px-4 py-6 ${className ?? ''}`}>
      <AppText variant="display">{title}</AppText>
      {message ? <AppText variant="muted">{message}</AppText> : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} variant="secondary" />
      ) : null}
    </View>
  );
}
