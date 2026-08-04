import { SafeAreaView, type SafeAreaViewProps } from 'react-native-safe-area-context';

import { cn } from '@/lib/cn';

interface ScreenProps extends SafeAreaViewProps {
  className?: string;
}

export function Screen({ className, children, ...props }: ScreenProps) {
  return (
    <SafeAreaView
      className={cn('flex-1 bg-bg', className)}
      edges={['top', 'left', 'right']}
      {...props}
    >
      {children}
    </SafeAreaView>
  );
}
