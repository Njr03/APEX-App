import { Tabs, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { AnimatedPageContent } from '@/components/navigation/AnimatedPageContent';
import { AppSidebar } from '@/components/navigation/AppSidebar';
import { AppTopBar } from '@/components/navigation/AppTopBar';
import {
  segmentToAppPage,
  useNavigationStore,
} from '@/stores/navigationStore';

function NavigationSync() {
  const segments = useSegments();
  const setActivePage = useNavigationStore((state) => state.setActivePage);

  useEffect(() => {
    setActivePage(segmentToAppPage(segments[1]));
  }, [segments, setActivePage]);

  return null;
}

export default function TabLayout() {
  return (
    <View className="flex-1 bg-bg">
      <NavigationSync />
      <AppTopBar />
      <View className="flex-1 flex-row">
        <AppSidebar />
        <AnimatedPageContent className="flex-1">
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarStyle: { display: 'none' },
            }}
          >
            <Tabs.Screen
              name="index"
              options={{
                title: 'Dashboard',
              }}
            />
            <Tabs.Screen
              name="workouts"
              options={{
                title: 'Workouts',
              }}
            />
            <Tabs.Screen
              name="exercises"
              options={{
                title: 'Exercises',
              }}
            />
            <Tabs.Screen
              name="progress"
              options={{
                title: 'Progress',
              }}
            />
            <Tabs.Screen
              name="profile"
              options={{
                title: 'Account',
                href: null,
              }}
            />
          </Tabs>
        </AnimatedPageContent>
      </View>
    </View>
  );
}
