import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
import Svg, { Line } from 'react-native-svg';

import { Sparkline } from '@/components/progress/Sparkline';
import { colors, fonts } from '@/constants/theme';
import {
  formatHistoryDelta,
  type KeyLiftProgressionRow,
} from '@/lib/progress/keyLifts';
import { kgToDisplay } from '@/lib/units';

const CARD_BG = '#141427';
const CARD_BORDER = 'rgba(255,255,255,0.06)';

function KeyLiftRow({ row }: { row: KeyLiftProgressionRow }) {
  const { definition, history, currentMax, deltaKg } = row;

  return (
    <View
      className="flex-row items-center"
      style={{ gap: 12, paddingVertical: 10 }}
    >
      <View className="min-w-0 flex-1" style={{ gap: 4 }}>
        <Text
          numberOfLines={1}
          style={{
            color: colors.text,
            fontFamily: fonts.bodySemiBold,
            fontSize: 13,
            fontWeight: '600',
          }}
        >
          {definition.label}
        </Text>
        <Text
          style={{
            color: colors.muted,
            fontFamily: fonts.jetbrainsMono,
            fontSize: 10,
          }}
        >
          {history.length >= 2
            ? formatHistoryDelta(deltaKg)
            : 'Log sessions to track progression'}
        </Text>
      </View>

      <Sparkline color={definition.color} data={history} />

      <View style={{ alignItems: 'flex-end', minWidth: 56 }}>
        <Text
          style={{
            color: definition.color,
            fontFamily: fonts.brand,
            fontSize: 16,
            fontWeight: '700',
          }}
        >
          {currentMax > 0 ? kgToDisplay(currentMax, 'kg') : '—'}
        </Text>
        <Text
          style={{
            color: colors.muted,
            fontFamily: fonts.jetbrainsMono,
            fontSize: 9,
          }}
        >
          kg
        </Text>
      </View>
    </View>
  );
}

export function KeyLiftsProgression({ rows }: { rows: KeyLiftProgressionRow[] }) {
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
      <View className="flex-row items-center" style={{ gap: 8 }}>
        <Svg height={16} viewBox="0 0 16 16" width={16}>
          <Line
            stroke="#ff8c42"
            strokeWidth={2}
            x1={1}
            x2={15}
            y1={12}
            y2={4}
          />
        </Svg>
        <Text
          style={{
            color: colors.text,
            fontFamily: fonts.jetbrainsMono,
            fontSize: 9,
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
        >
          Key Lifts Progression
        </Text>
      </View>

      {rows.length === 0 ? (
        <Text style={{ color: colors.muted, fontFamily: fonts.body, fontSize: 12 }}>
          Complete workouts to see lift trends.
        </Text>
      ) : (
        rows.map((row, index) => (
          <View key={row.definition.exerciseName}>
            <KeyLiftRow row={row} />
            {index < rows.length - 1 ? (
              <View style={{ backgroundColor: CARD_BORDER, height: 1 }} />
            ) : null}
          </View>
        ))
      )}
    </View>
  );
}
