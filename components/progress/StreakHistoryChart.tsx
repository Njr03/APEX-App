import { Text, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';
import { streakBarOpacity, type StreakRun } from '@/lib/progress/streakHistory';

const CARD_BG = '#141427';
const CARD_BORDER = 'rgba(255,255,255,0.06)';
const MAX_BAR_HEIGHT = 52;
const MIN_BAR_HEIGHT = 4;
const BAR_WIDTH = 14;

export function StreakHistoryChart({
  runs,
  longestStreak,
}: {
  runs: StreakRun[];
  longestStreak: number;
}) {
  const maxLength = Math.max(...runs.map((run) => run.length), 1);

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
        <Text style={{ fontSize: 14, lineHeight: 16 }}>🔥</Text>
        <Text
          style={{
            color: colors.text,
            fontFamily: fonts.jetbrainsMono,
            fontSize: 9,
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
        >
          Streak History
        </Text>
      </View>

      {runs.length === 0 ? (
        <Text style={{ color: colors.muted, fontFamily: fonts.body, fontSize: 12 }}>
          Complete workouts on consecutive days to build streak runs.
        </Text>
      ) : (
        <View className="flex-row items-end" style={{ gap: 6 }}>
          {runs.map((run, index) => {
            const height = Math.max(
              MIN_BAR_HEIGHT,
              (run.length / maxLength) * MAX_BAR_HEIGHT,
            );
            const opacity = streakBarOpacity(run.length, longestStreak);

            return (
              <View key={`${run.endDate}-${index}`} className="items-center" style={{ gap: 6 }}>
                <View
                  style={{
                    backgroundColor: `rgba(245,200,66,${opacity})`,
                    borderTopLeftRadius: 4,
                    borderTopRightRadius: 4,
                    height,
                    width: BAR_WIDTH,
                  }}
                />
                <Text
                  style={{
                    color: colors.muted2,
                    fontFamily: fonts.jetbrainsMono,
                    fontSize: 8,
                    textAlign: 'center',
                  }}
                >
                  {run.length}d
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
