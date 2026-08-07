import { create } from 'zustand';

export type AppPage = 'index' | 'workouts' | 'exercises' | 'profile';

const INITIAL_SCROLL_TO_TOP_TICK: Record<AppPage, number> = {
  index: 0,
  workouts: 0,
  exercises: 0,
  profile: 0,
};

interface NavigationState {
  activePage: AppPage;
  scrollToTopTick: Record<AppPage, number>;
  requestScrollToTop: (page: AppPage) => void;
  setActivePage: (page: AppPage) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  activePage: 'index',
  scrollToTopTick: INITIAL_SCROLL_TO_TOP_TICK,
  requestScrollToTop: (page) =>
    set((state) => ({
      scrollToTopTick: {
        ...state.scrollToTopTick,
        [page]: state.scrollToTopTick[page] + 1,
      },
    })),
  setActivePage: (page) => set({ activePage: page }),
}));

export const PAGE_TITLES: Record<AppPage, string> = {
  index: 'Dashboard',
  workouts: 'Workouts',
  exercises: 'Exercises',
  profile: 'Profile',
};

export function segmentToAppPage(segment?: string): AppPage {
  if (
    segment === 'workouts' ||
    segment === 'exercises' ||
    segment === 'profile'
  ) {
    return segment;
  }

  return 'index';
}
