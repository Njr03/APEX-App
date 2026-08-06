import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { format } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LevelDetailModal } from '@/components/dashboard/LevelDetailModal';
import { WorkoutHistoryModal } from '@/components/history/WorkoutHistoryModal';
import {
  TOPBAR_BG,
  TOPBAR_BORDER,
  TOPBAR_HEIGHT,
  TOPBAR_HEIGHT_WITH_WELCOME,
} from '@/components/navigation/shellConstants';
import { useActiveWorkout, useProfile } from '@/hooks/queries';
import { useAuth } from '@/providers/AuthProvider';
import { calculateLevel } from '@/lib/xp';
import {
  PAGE_TITLES,
  useNavigationStore,
  type AppPage,
} from '@/stores/navigationStore';
import { colors, fonts } from '@/constants/theme';

const MUTED_TEXT = 'rgba(240,237,232,0.5)';

export const TOPBAR_DATE_TEXT_STYLE = {
  color: MUTED_TEXT,
  fontFamily: fonts.jetbrainsMono,
  fontSize: 11,
  letterSpacing: 0.3,
} as const;

export const TOPBAR_TITLE_TEXT_STYLE = {
  color: colors.text,
  fontFamily: fonts.brand,
  fontSize: 15,
  fontWeight: '700' as const,
};

export const TOPBAR_WELCOME_TEXT_STYLE = {
  color: colors.accent,
  fontFamily: fonts.jetbrainsMono,
  fontSize: 11,
  letterSpacing: 0.3,
} as const;

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
    case 'progress':
      return {
        label: 'View History',
        href: '/history',
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
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: activeWorkout } = useActiveWorkout();
  const [historyVisible, setHistoryVisible] = useState(false);
  const [levelVisible, setLevelVisible] = useState(false);

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
    activePage !== 'progress' &&
    activePage !== 'profile';
  const todayLabel = format(new Date(), 'EEE · MMM d').toUpperCase();
  const level = profile ? calculateLevel(profile.total_xp ?? 0) : null;
  const levelLabel = user && level != null ? `Level ${level}` : null;
  const showHeaderMeta = welcomeName != null || levelLabel != null;
  const barHeight = showHeaderMeta ? TOPBAR_HEIGHT_WITH_WELCOME : TOPBAR_HEIGHT;

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
            <Text
              accessibilityRole="header"
              style={{
                color: colors.accent,
                fontFamily: fonts.brand,
                fontSize: 16,
                fontWeight: '700',
                letterSpacing: 0.5,
              }}
            >
              APX
            </Text>
            {welcomeName ? (
              <Text
                numberOfLines={1}
                style={{
                  color: colors.text,
                  fontFamily: fonts.jetbrainsMono,
                  fontSize: 11,
                  letterSpacing: 0.3,
                }}
              >
                Welcome {welcomeName}
              </Text>
            ) : (
              <Text numberOfLines={1} style={TOPBAR_TITLE_TEXT_STYLE}>
                {PAGE_TITLES[activePage]}
              </Text>
            )}
          </View>
        </View>

        <View className="shrink-0 flex-row items-center gap-2">
          <View className="items-end" style={{ gap: 2 }}>
            <Pressable
              accessibilityHint="Opens workout history calendar"
              accessibilityLabel={`Today is ${format(new Date(), 'EEEE, MMMM d')}. Open workout history.`}
              accessibilityRole="button"
              className="rounded-md px-1 py-0.5 active:opacity-70"
              onPress={() => setHistoryVisible(true)}
            >
              <Text style={TOPBAR_DATE_TEXT_STYLE}>{todayLabel}</Text>
            </Pressable>

            {levelLabel ? (
              <Pressable
                accessibilityHint="Opens level progress summary"
                accessibilityLabel={`${levelLabel}. Open level details.`}
                accessibilityRole="button"
                className="rounded-md px-1 py-0.5 active:opacity-70"
                onPress={() => setLevelVisible(true)}
                style={Platform.OS === 'web' ? { cursor: 'pointer' } : undefined}
              >
                <Text numberOfLines={1} style={TOPBAR_WELCOME_TEXT_STYLE}>
                  {levelLabel}
                </Text>
              </Pressable>
            ) : null}
          </View>

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

      <WorkoutHistoryModal
        onClose={() => setHistoryVisible(false)}
        visible={historyVisible}
      />

      <LevelDetailModal
        onClose={() => setLevelVisible(false)}
        visible={levelVisible}
      />
    </View>
  );
}

export { TOPBAR_HEIGHT };
