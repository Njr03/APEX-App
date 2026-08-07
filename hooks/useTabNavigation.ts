import { router, type Href } from 'expo-router';

import {
  useNavigationStore,
  type AppPage,
} from '@/stores/navigationStore';

export function useTabNavigation() {
  const activePage = useNavigationStore((state) => state.activePage);
  const setActivePage = useNavigationStore((state) => state.setActivePage);
  const requestScrollToTop = useNavigationStore(
    (state) => state.requestScrollToTop,
  );

  const navigateToTab = (page: AppPage, href: Href) => {
    if (activePage !== page) {
      setActivePage(page);
      router.push(href);
    }

    requestScrollToTop(page);
  };

  return { activePage, navigateToTab };
}
