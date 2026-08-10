import { View } from 'react-native';
import { Text } from '@/components/ui/Text';

import {
  DashboardDetailModal,
  DashboardDetailRow,
  DashboardDetailSection,
} from '@/components/dashboard/DashboardDetailModal';
import { colors, fonts } from '@/constants/theme';
import {
  getMuscleBarFillColor,
  getMuscleTextColor,
  type MuscleBalancePoint,
} from '@/lib/muscleBalance';

interface MuscleBalanceDetailModalProps {
  visible: boolean;
  onClose: () => void;
  points: MuscleBalancePoint[];
}

export function MuscleBalanceDetailModal({
  visible,
  onClose,
  points,
}: MuscleBalanceDetailModalProps) {
  const sorted = [...points].sort((a, b) => b.value - a.value);
  const average = Math.round(
    points.reduce((sum, point) => sum + point.value, 0) / Math.max(points.length, 1),
  );
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  return (
    <DashboardDetailModal
      eyebrow="Training insight"
      eyebrowColor={colors.accent}
      onClose={onClose}
      subtitle="Last 4 weeks · volume coverage vs monthly target"
      title="Muscle Balance"
      visible={visible}
    >
      <DashboardDetailSection title="Overview">
        <DashboardDetailRow
          label="Average coverage"
          value={`${average}%`}
          valueColor={colors.accent}
        />
        {strongest ? (
          <DashboardDetailRow
            label="Strongest group"
            value={`${strongest.label} · ${strongest.value}%`}
            valueColor={getMuscleTextColor(strongest.value, colors.muted)}
          />
        ) : null}
        {weakest ? (
          <DashboardDetailRow
            label="Needs attention"
            value={`${weakest.label} · ${weakest.value}%`}
            valueColor={getMuscleTextColor(weakest.value, colors.muted)}
          />
        ) : null}
      </DashboardDetailSection>

      <DashboardDetailSection title="Muscle groups">
        {points.map((point) => {
          const textColor = getMuscleTextColor(point.value, colors.muted);
          const barFill = getMuscleBarFillColor(point.value, 'rgba(240,237,232,0.25)');

          return (
            <View key={point.key} style={{ gap: 4 }}>
              <View className="flex-row items-center justify-between">
                <Text style={{ color: textColor, fontFamily: fonts.jetbrainsMono, fontSize: 11 }}>
                  {point.label}
                </Text>
                <Text style={{ color: textColor, fontFamily: fonts.jetbrainsMono, fontSize: 11 }}>
                  {point.value}%
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  borderRadius: 2,
                  height: 4,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    backgroundColor: barFill,
                    borderRadius: 2,
                    height: 4,
                    width: `${point.value}%`,
                  }}
                />
              </View>
            </View>
          );
        })}
      </DashboardDetailSection>
    </DashboardDetailModal>
  );
}
