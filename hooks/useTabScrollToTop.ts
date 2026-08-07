import { useEffect, useRef, type RefObject } from 'react';
import type { FlatList, ScrollView } from 'react-native';

import { useNavigationStore, type AppPage } from '@/stores/navigationStore';

function useTabScrollToTopEffect<T>(
  page: AppPage,
  ref: RefObject<ScrollView | FlatList<T> | null>,
) {
  const tick = useNavigationStore((state) => state.scrollToTopTick[page]);

  useEffect(() => {
    if (tick === 0) return;

    const frame = requestAnimationFrame(() => {
      const scrollable = ref.current;
      if (!scrollable) return;

      if ('scrollToOffset' in scrollable) {
        scrollable.scrollToOffset({ offset: 0, animated: true });
        return;
      }

      scrollable.scrollTo({ y: 0, animated: true });
    });

    return () => cancelAnimationFrame(frame);
  }, [page, ref, tick]);
}

export function useTabScrollViewToTop(page: AppPage) {
  const ref = useRef<ScrollView>(null);
  useTabScrollToTopEffect(page, ref);
  return ref;
}

export function useTabFlatListScrollToTop<T>(page: AppPage) {
  const ref = useRef<FlatList<T>>(null);
  useTabScrollToTopEffect(page, ref);
  return ref;
}
