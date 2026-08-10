import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BOTTOM_BAR_HEIGHT,
  TOPBAR_BG,
  TOPBAR_BORDER,
} from '@/components/navigation/shellConstants';
import { NAV_ITEMS, PROFILE_NAV } from '@/components/navigation/navItems';
import { useLayoutBreakpoint } from '@/hooks/useLayoutBreakpoint';
import { useTabNavigation } from '@/hooks/useTabNavigation';
import { type AppPage } from '@/stores/navigationStore';
import { fonts } from '@/constants/theme';

const BOTTOM_NAV_LABELS: Record<AppPage, string> = {
  index: 'Home',
  workouts: 'Workouts',
  exercises: 'Lifts',
  profile: 'Profile',
};

const NAV_ICON_SIZE = 20;
const NAV_ICON_DEFAULT = 'rgba(232,230,240,0.45)';
const NAV_ACTIVE_COLOR = '#c8ff5a';

interface BottomNavButtonProps {
  label: string;
  icon?: typeof NAV_ITEMS[number]['icon'];
  active: boolean;
  onPress: () => void;
  profile?: boolean;
}

function BottomNavButton({
  label,
  icon: Icon,
  active,
  onPress,
  profile = false,
}: BottomNavButtonProps) {
  const iconColor = active ? NAV_ACTIVE_COLOR : NAV_ICON_DEFAULT;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className="flex-1 items-center justify-center active:opacity-80"
      onPress={onPress}
      style={{ minHeight: BOTTOM_BAR_HEIGHT, paddingVertical: 6 }}
    >
      {profile ? (
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            borderWidth: 1.5,
            borderColor: iconColor,
          }}
        />
      ) : Icon ? (
        <Icon color={iconColor} size={NAV_ICON_SIZE} strokeWidth={2} />
      ) : null}
      <Text
        numberOfLines={1}
        style={{
          color: iconColor,
          fontFamily: fonts.jetbrainsMono,
          fontSize: 9,
          letterSpacing: 0.2,
          marginTop: 4,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function AppBottomBar() {
  const insets = useSafeAreaInsets();
  const { isCompact } = useLayoutBreakpoint();
  const { activePage, navigateToTab } = useTabNavigation();

  const labelFor = (page: AppPage, fallback: string) =>
    isCompact ? BOTTOM_NAV_LABELS[page] : fallback;

  return (
    <View
      className="flex-row items-stretch border-t border-border"
      style={{
        backgroundColor: TOPBAR_BG,
        borderTopColor: TOPBAR_BORDER,
        paddingBottom: Math.max(insets.bottom, 8),
      }}
    >
      {NAV_ITEMS.map((item) => (
        <BottomNavButton
          key={item.route}
          active={activePage === item.route}
          icon={item.icon}
          label={labelFor(item.route, item.label)}
          onPress={() => navigateToTab(item.route, item.href)}
        />
      ))}
      <BottomNavButton
        active={activePage === PROFILE_NAV.route}
        label={labelFor(PROFILE_NAV.route, PROFILE_NAV.label)}
        onPress={() => navigateToTab(PROFILE_NAV.route, PROFILE_NAV.href)}
        profile
      />
    </View>
  );
}
