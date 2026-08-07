import { create } from 'zustand';

export type AppPage = 'index' | 'workouts' | 'exercises' | 'profile';

interface NavigationState {
  activePage: AppPage;
  setActivePage: (page: AppPage) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  activePage: 'index',
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
