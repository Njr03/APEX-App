import { Platform, Pressable, Text, View } from 'react-native';

import {
  DASHBOARD_TILE_BG,
  dashboardCardFrameStyle,
  dashboardPressStyle,
  dashboardTileWebClassName,
  useDashboardTilePress,
} from '@/lib/dashboard/cardStyles';
import type { StatDeltaTone } from '@/lib/dashboard/statTiles';
import { fonts } from '@/constants/theme';

const MUTED = 'rgba(240,237,232,0.5)';
const DELTA_POSITIVE = '#c8ff5a';
const DELTA_NEGATIVE = '#ff5f5f';

interface StatTileProps {
  label: string;
  value: string;
  unit?: string;
  accentColor: string;
  delta: string;
  deltaTone: StatDeltaTone;
  onPress?: () => void;
}

function deltaColor(tone: StatDeltaTone): string {
  if (tone === 'positive') return DELTA_POSITIVE;
  if (tone === 'negative') return DELTA_NEGATIVE;
  return MUTED;
}

export function StatTile({
  label,
  value,
  unit,
  accentColor,
  delta,
  deltaTone,
  onPress,
}: StatTileProps) {
  const { pressed, handlers } = useDashboardTilePress(onPress);

  return (
    <Pressable
      accessibilityLabel={`${label}, ${value}${unit ?? ''}. ${delta}`}
      accessibilityRole="button"
      className={dashboardTileWebClassName()}
      {...handlers}
      style={{
        alignSelf: 'stretch',
        backgroundColor: DASHBOARD_TILE_BG,
        borderWidth: 1,
        cursor: Platform.OS === 'web' ? ('pointer' as const) : undefined,
        minWidth: 0,
        paddingHorizontal: 16,
        paddingVertical: 14,
        width: '100%',
        ...dashboardCardFrameStyle(12),
        ...dashboardPressStyle(pressed),
      }}
    >
      <Text
        style={{
          color: MUTED,
          fontFamily: fonts.jetbrainsMono,
          fontSize: 9,
          letterSpacing: 2,
          marginBottom: 7,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>

      <View style={{ alignItems: 'baseline', flexDirection: 'row' }}>
        <Text
          style={{
            color: accentColor,
            fontFamily: fonts.brand,
            fontSize: 26,
            fontWeight: '700',
            letterSpacing: -0.5,
            lineHeight: 26,
          }}
        >
          {value}
        </Text>
        {unit ? (
          <Text
            style={{
              color: MUTED,
              fontFamily: fonts.brand,
              fontSize: 13,
              fontWeight: '400',
            }}
          >
            {unit}
          </Text>
        ) : null}
      </View>

      <Text
        style={{
          color: deltaColor(deltaTone),
          fontFamily: fonts.jetbrainsMono,
          fontSize: 10,
          marginTop: 5,
        }}
      >
        {delta}
      </Text>
    </Pressable>
  );
}
