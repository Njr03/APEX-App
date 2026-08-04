import { Text, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';
import type { EstimatedOneRmTile } from '@/hooks/useProgressPageData';
import { kgToDisplay } from '@/lib/units';

const CARD_BG = '#141427';
const CARD_BORDER = 'rgba(255,255,255,0.06)';

function OneRmTile({ tile }: { tile: EstimatedOneRmTile }) {
  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: CARD_BG,
        borderColor: CARD_BORDER,
        borderRadius: 10,
        borderWidth: 1,
        flex: 1,
        minWidth: 72,
        padding: 12,
      }}
    >
      <Text
        style={{
          color: colors.muted,
          fontFamily: fonts.jetbrainsMono,
          fontSize: 9,
          letterSpacing: 1.5,
          marginBottom: 6,
          textTransform: 'uppercase',
        }}
      >
        {tile.shortLabel}
      </Text>
      <Text
        style={{
          color: tile.color,
          fontFamily: fonts.brand,
          fontSize: 24,
          fontWeight: '700',
        }}
      >
        {tile.value > 0 ? kgToDisplay(tile.value, 'kg') : '—'}
      </Text>
      <Text
        style={{
          color: colors.muted,
          fontFamily: fonts.jetbrainsMono,
          fontSize: 9,
          marginTop: 2,
        }}
      >
        kg est.
      </Text>
    </View>
  );
}

export function EstimatedOneRmGrid({ tiles }: { tiles: EstimatedOneRmTile[] }) {
  return (
    <View
      style={{
        backgroundColor: CARD_BG,
        borderColor: CARD_BORDER,
        borderRadius: 12,
        borderWidth: 1,
        gap: 12,
        padding: 16,
      }}
    >
      <View className="flex-row items-center justify-between gap-3">
        <Text
          style={{
            color: colors.text,
            fontFamily: fonts.jetbrainsMono,
            fontSize: 9,
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
        >
          Estimated 1RM
        </Text>
        <Text
          style={{
            color: colors.muted2,
            fontFamily: fonts.jetbrainsMono,
            fontSize: 10,
          }}
        >
          w × (1 + r/30)
        </Text>
      </View>

      <View className="flex-row flex-wrap" style={{ gap: 10 }}>
        {tiles.map((tile) => (
          <OneRmTile key={tile.shortLabel} tile={tile} />
        ))}
      </View>
    </View>
  );
}
