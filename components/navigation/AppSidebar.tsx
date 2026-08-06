import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NAV_ITEMS, PROFILE_NAV } from '@/components/navigation/navItems';
import { SIDEBAR_WIDTH } from '@/components/navigation/shellConstants';
import {
  useNavigationStore,
  type AppPage,
} from '@/stores/navigationStore';

const NAV_ICON_SIZE = 20;
const NAV_BUTTON_SIZE = 44;
const NAV_BUTTON_RADIUS = 11;
const NAV_ICON_DEFAULT = 'rgba(232,230,240,0.45)';
const NAV_HOVER_BG = '#141427';
const NAV_ACTIVE_BG = 'rgba(200,255,90,0.10)';
const NAV_ACTIVE_BORDER = 'rgba(200,255,90,0.18)';

interface SidebarNavButtonProps {
  label: string;
  icon: (typeof NAV_ITEMS)[number]['icon'];
  active: boolean;
  onPress: () => void;
}

function SidebarNavButton({
  label,
  icon: Icon,
  active,
  onPress,
}: SidebarNavButtonProps) {
  const [hovered, setHovered] = useState(false);

  const iconColor = active
    ? '#c8ff5a'
    : hovered
      ? '#e8e6f0'
      : NAV_ICON_DEFAULT;
  const backgroundColor = active
    ? NAV_ACTIVE_BG
    : hovered
      ? NAV_HOVER_BG
      : 'transparent';
  const borderColor = active ? NAV_ACTIVE_BORDER : 'transparent';
  const borderWidth = active ? 1 : 0;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className="items-center justify-center active:opacity-90"
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={onPress}
      style={{
        width: NAV_BUTTON_SIZE,
        height: NAV_BUTTON_SIZE,
        borderRadius: NAV_BUTTON_RADIUS,
        backgroundColor,
        borderColor,
        borderWidth,
      }}
    >
      <Icon color={iconColor} size={NAV_ICON_SIZE} strokeWidth={2} />
    </Pressable>
  );
}

function SidebarProfileButton({
  active,
  onPress,
}: {
  active: boolean;
  onPress: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const outlineColor = active
    ? '#c8ff5a'
    : hovered
      ? '#e8e6f0'
      : NAV_ICON_DEFAULT;
  const backgroundColor = active
    ? NAV_ACTIVE_BG
    : hovered
      ? NAV_HOVER_BG
      : 'transparent';
  const borderColor = active ? NAV_ACTIVE_BORDER : 'transparent';
  const borderWidth = active ? 1 : 0;

  return (
    <Pressable
      accessibilityLabel="Profile"
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className="items-center justify-center active:opacity-90"
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={onPress}
      style={{
        width: NAV_BUTTON_SIZE,
        height: NAV_BUTTON_SIZE,
        borderRadius: NAV_BUTTON_RADIUS,
        backgroundColor,
        borderColor,
        borderWidth,
      }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: outlineColor,
          backgroundColor: 'transparent',
        }}
      />
    </Pressable>
  );
}

export function AppSidebar() {
  const insets = useSafeAreaInsets();
  const activePage = useNavigationStore((state) => state.activePage);
  const setActivePage = useNavigationStore((state) => state.setActivePage);

  const navigateTo = (page: AppPage, href: Href) => {
    setActivePage(page);
    router.push(href);
  };

  return (
    <View
      className="border-r border-border bg-bg"
      style={{
        paddingTop: 16,
        paddingBottom: Math.max(insets.bottom, 16),
        paddingHorizontal: (SIDEBAR_WIDTH - NAV_BUTTON_SIZE) / 2,
        width: SIDEBAR_WIDTH,
      }}
    >
      <View className="flex-1 items-center">
        <View className="items-center" style={{ gap: 6 }}>
          {NAV_ITEMS.map((item) => (
            <SidebarNavButton
              key={item.route}
              active={activePage === item.route}
              icon={item.icon}
              label={item.label}
              onPress={() => navigateTo(item.route, item.href)}
            />
          ))}
        </View>
      </View>

      <SidebarProfileButton
        active={activePage === PROFILE_NAV.route}
        onPress={() => navigateTo(PROFILE_NAV.route, PROFILE_NAV.href)}
      />
    </View>
  );
}
