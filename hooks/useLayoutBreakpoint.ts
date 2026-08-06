import { useWindowDimensions } from 'react-native';

import { MOBILE_BREAKPOINT } from '@/components/navigation/shellConstants';

export function useLayoutBreakpoint() {
  const { width, height } = useWindowDimensions();
  const shortestSide = Math.min(width, height);
  const isCompact = shortestSide < MOBILE_BREAKPOINT;

  return { isCompact, width, height, shortestSide };
}
