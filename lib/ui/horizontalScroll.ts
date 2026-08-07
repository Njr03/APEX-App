import { Platform } from 'react-native';
import type { RefObject } from 'react';

export type HorizontalScrollTarget = {
  scrollTo?: (options: { x: number; y: number; animated?: boolean }) => void;
  scrollToOffset?: (options: { offset: number; animated?: boolean }) => void;
};

type HorizontalScrollRef = RefObject<HorizontalScrollTarget | null>;

function getScrollElement(scrollRef: HorizontalScrollRef): HTMLElement | null {
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
  scrollRef: HorizontalScrollRef,
  x: number,
  animated: boolean,
) {
  const target = scrollRef.current;
  if (!target) return;

  if (typeof target.scrollToOffset === 'function') {
    target.scrollToOffset({ offset: x, animated });
  } else {
    target.scrollTo?.({ x, y: 0, animated });
  }

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
