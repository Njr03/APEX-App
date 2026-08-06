import { useWindowDimensions } from 'react-native';

import { MOBILE_BREAKPOINT } from '@/components/navigation/shellConstants';

export function useLayoutBreakpoint() {
  const { width } = useWindowDimensions();
  const isCompact = width < MOBILE_BREAKPOINT;

  return { isCompact, width };
}
