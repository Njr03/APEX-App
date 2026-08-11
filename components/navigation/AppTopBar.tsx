import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { format } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApexLogoQuoteTrigger } from '@/components/branding/ApexLogoQuoteTrigger';
import { WorkoutHistoryModal } from '@/components/history/WorkoutHistoryModal';
import {
  TOPBAR_BG,
  TOPBAR_BORDER,
  TOPBAR_HEIGHT,
  TOPBAR_HEIGHT_WITH_WELCOME,
} from '@/components/navigation/shellConstants';
import { useActiveWorkout, useProfile } from '@/hooks/queries';
import {
  PAGE_TITLES,
  useNavigationStore,
  type AppPage,
} from '@/stores/navigationStore';
import { fonts, APP_TEXT_TRANSFORM } from '@/constants/theme';

const MUTED_TEXT = 'rgba(240,237,232,0.5)';

export const TOPBAR_DATE_TEXT_STYLE = {
  color: MUTED_TEXT,
  fontFamily: fonts.jetbrainsMono,
  fontSize: 12,
  letterSpacing: 0.3,
  ...APP_TEXT_TRANSFORM,
} as const;

export const TOPBAR_PAGE_TEXT_STYLE = {
  color: MUTED_TEXT,
  fontFamily: fonts.body,
  fontSize: 12,
  letterSpacing: 0.3,
  ...APP_TEXT_TRANSFORM,
} as const;

export const TOPBAR_TITLE_TEXT_STYLE = {
  color: MUTED_TEXT,
  fontFamily: fonts.body,
  fontSize: 12,
  letterSpacing: 0.3,
  ...APP_TEXT_TRANSFORM,
};

function getTopBarCta(
  page: AppPage,
  hasActiveWorkout: boolean,
): { label: string; href: Href } {
  switch (page) {
    case 'workouts':
      return {
        label: hasActiveWorkout ? 'Resume Workout' : 'Create Workout',
        href: '/routines/new',
      };
    case 'exercises':
      return {
        label: 'Add Exercise',
        href: '/exercises/new',
      };
    default:
      return {
        label: 'Start Workout',
        href: '/workout/active',
      };
  }
}

function TopBarCta({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      className="active:opacity-70"
      onPress={onPress}
    >
      <Text style={TOPBAR_TITLE_TEXT_STYLE}>{label}</Text>
    </Pressable>
  );
}

export function AppTopBar() {
  const insets = useSafeAreaInsets();
  const activePage = useNavigationStore((state) => state.activePage);
  const { data: profile } = useProfile();
  const { data: activeWorkout } = useActiveWorkout();
  const [historyVisible, setHistoryVisible] = useState(false);

  const welcomeName =
    activePage === 'index'
      ? profile?.display_name ?? profile?.username ?? null
      : null;

  const hasActiveWorkout =
    activeWorkout != null && activeWorkout.status === 'in_progress';
  const cta = getTopBarCta(activePage, hasActiveWorkout);
  const showTopBarCta =
    activePage !== 'index' &&
    activePage !== 'workouts' &&
    activePage !== 'exercises' &&
    activePage !== 'profile';
  const todayLabel = format(new Date(), 'EEE · MMM d').toUpperCase();
  const barHeight = TOPBAR_HEIGHT_WITH_WELCOME;

  return (
    <View
      className="flex-row items-stretch"
      style={{
        backgroundColor: TOPBAR_BG,
        borderBottomColor: TOPBAR_BORDER,
        borderBottomWidth: 1,
        minHeight: barHeight,
        paddingTop: insets.top,
      }}
    >
      <View
        className="min-w-0 flex-1 flex-row items-center justify-between"
        style={{
          minHeight: barHeight,
          paddingHorizontal: 16,
        }}
      >
        <View className="min-w-0 flex-1 justify-center">
          <View style={{ gap: 2 }}>
            <ApexLogoQuoteTrigger height={65} />

            <View
              className="flex-row items-center justify-between"
              style={{ gap: 12 }}
            >
              <Text
                className="min-w-0 shrink"
                numberOfLines={1}
                style={[TOPBAR_PAGE_TEXT_STYLE, { flex: 1 }]}
              >
                {welcomeName ? `Welcome ${welcomeName}` : PAGE_TITLES[activePage]}
              </Text>

              <View className="shrink-0 flex-row items-center gap-2">
                <Pressable
                  accessibilityHint="Opens workout history calendar"
                  accessibilityLabel={`Today is ${format(new Date(), 'EEEE, MMMM d')}. Open workout history.`}
                  accessibilityRole="button"
                  className="rounded-md px-1 py-0.5 active:opacity-70"
                  onPress={() => setHistoryVisible(true)}
                >
                  <Text style={TOPBAR_DATE_TEXT_STYLE}>{todayLabel}</Text>
                </Pressable>

                {showTopBarCta ? (
                  <>
                    <View
                      style={{
                        backgroundColor: TOPBAR_BORDER,
                        height: 18,
                        marginHorizontal: 4,
                        width: 1,
                      }}
                    />

                    <TopBarCta
                      label={cta.label}
                      onPress={() => router.push(cta.href)}
                    />
                  </>
                ) : null}
              </View>
            </View>
          </View>
        </View>
      </View>

      <WorkoutHistoryModal
        onClose={() => setHistoryVisible(false)}
        visible={historyVisible}
      />
    </View>
  );
}

export { TOPBAR_HEIGHT };
