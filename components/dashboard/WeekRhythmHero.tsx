import { Dimensions, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

import { AppText } from '@/components/ui/AppText';
import { useCurrentWeekNumber } from '@/hooks/useCurrentWeekNumber';
import { colors, fonts } from '@/constants/theme';
import type { DailyVolumePoint } from '@/lib/dashboard/stats';
import { kgToDisplay, volumeLabel } from '@/lib/units';

interface WeekRhythmHeroProps {
  data: DailyVolumePoint[];
  unit: 'kg' | 'lb';
}

const HERO_BG = '#141427';
const HERO_BORDER = 'rgba(255,255,255,0.06)';

export function WeekRhythmHero({ data, unit }: WeekRhythmHeroProps) {
  const { weekNumber } = useCurrentWeekNumber();
  const chartWidth = Math.min(Dimensions.get('window').width - 160, 720);
  const maxValue = Math.max(...data.map((point) => point.volume), 1);

  const chartData = data.map((point) => ({
    value: point.volume,
    label: point.label,
    frontColor: point.volume > 0 ? colors.accent : colors.surface2,
  }));

  return (
    <View
      className="gap-4"
      style={{
        backgroundColor: HERO_BG,
        borderColor: HERO_BORDER,
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
      }}
    >
      <View className="flex-row items-end justify-between">
        <View>
          <AppText
            style={{
              color: colors.muted,
              fontFamily: fonts.jetbrainsMono,
              fontSize: 9,
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            Week Rhythm
          </AppText>
          <AppText className="mt-1 text-xl" variant="display">
            Week {weekNumber}
          </AppText>
        </View>
        <AppText variant="muted">Last 7 days · {volumeLabel(unit)}</AppText>
      </View>

      <View className="overflow-hidden rounded-lg">
        <BarChart
          barBorderRadius={4}
          barWidth={22}
          data={chartData}
          height={140}
          initialSpacing={12}
          maxValue={maxValue * 1.2}
          noOfSections={3}
          spacing={Math.max(
            10,
            (chartWidth - 48) / Math.max(chartData.length, 1) - 22,
          )}
          width={chartWidth}
          xAxisColor={colors.border}
          yAxisColor={colors.border}
          yAxisTextStyle={{ color: colors.muted, fontSize: 9 }}
          xAxisLabelTextStyle={{ color: colors.muted, fontSize: 9 }}
          rulesColor={colors.border}
          renderTooltip={(item: { value: number }) => (
            <View className="rounded-md bg-surface2 px-2 py-1">
              <AppText className="text-xs" variant="mono">
                {kgToDisplay(item.value, unit)} {volumeLabel(unit)}
              </AppText>
            </View>
          )}
        />
      </View>
    </View>
  );
}
