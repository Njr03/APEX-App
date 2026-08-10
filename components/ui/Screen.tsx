import { SafeAreaView, type SafeAreaViewProps } from 'react-native-safe-area-context';

import { cn } from '@/lib/cn';

interface ScreenProps extends SafeAreaViewProps {
  className?: string;
  backgroundColor?: string;
}

export function Screen({
  className,
  backgroundColor,
  style,
  children,
  ...props
}: ScreenProps) {
  return (
    <SafeAreaView
      className={cn('flex-1', backgroundColor ? undefined : 'bg-bg', className)}
      edges={['top', 'left', 'right']}
      style={[backgroundColor ? { backgroundColor } : null, style]}
      {...props}
    >
      {children}
    </SafeAreaView>
  );
}
