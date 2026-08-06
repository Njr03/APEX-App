import { Platform, type ScrollView } from 'react-native';
import type { RefObject } from 'react';

type ScrollViewRef = RefObject<ScrollView | null>;

function getScrollElement(scrollRef: ScrollViewRef): HTMLElement | null {
  if (Platform.OS !== 'web') return null;

  const scrollView = scrollRef.current as unknown as {
    getScrollableNode?: () => HTMLElement;
    _component?: HTMLElement;
    scrollRef?: { current?: HTMLElement | null };
  } | null;

  if (!scrollView) return null;

  return (
    scrollView.getScrollableNode?.() ??
    scrollView._component ??
    scrollView.scrollRef?.current ??
    null
  );
}

export function scrollHorizontalTo(
  scrollRef: ScrollViewRef,
  x: number,
  animated: boolean,
) {
  scrollRef.current?.scrollTo({ x, y: 0, animated });

  if (Platform.OS !== 'web') return;

  requestAnimationFrame(() => {
    const node = getScrollElement(scrollRef);
    if (!node) return;

    if (animated && typeof node.scrollTo === 'function') {
      node.scrollTo({ left: x, behavior: 'smooth' });
      return;
    }

    node.scrollLeft = x;
  });
}
