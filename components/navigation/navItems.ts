import { type Href } from 'expo-router';
import {
  Dumbbell,
  LayoutGrid,
  LineChart,
  ListChecks,
  type LucideIcon,
} from 'lucide-react-native';

import type { AppPage } from '@/stores/navigationStore';

export type TabRoute = Exclude<AppPage, 'profile'>;

export interface NavItem {
  route: TabRoute;
  href: Href;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  {
    route: 'index',
    href: '/',
    label: 'Dashboard',
    icon: LayoutGrid,
  },
  {
    route: 'workouts',
    href: '/workouts',
    label: 'Workouts',
    icon: ListChecks,
  },
  {
    route: 'exercises',
    href: '/exercises',
    label: 'Exercises',
    icon: Dumbbell,
  },
  {
    route: 'progress',
    href: '/progress',
    label: 'Progress',
    icon: LineChart,
  },
];

export const PROFILE_NAV = {
  route: 'profile' as const,
  href: '/profile' as Href,
  label: 'Profile',
};
