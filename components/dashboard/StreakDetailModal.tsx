import {
  DashboardDetailModal,
  DashboardDetailRow,
  DashboardDetailSection,
} from '@/components/dashboard/DashboardDetailModal';
import { colors } from '@/constants/theme';
import type { StreakMetrics } from '@/hooks/useStreakMetrics';

interface StreakDetailModalProps {
  visible: boolean;
  onClose: () => void;
  metrics: StreakMetrics | undefined;
  isLoading?: boolean;
}

export function StreakDetailModal({
  visible,
  onClose,
  metrics,
  isLoading = false,
}: StreakDetailModalProps) {
  const streakTitle =
    metrics && metrics.currentStreak === 1
      ? '1 day'
      : metrics
        ? `${metrics.currentStreak} days`
        : 'Streak';

  return (
    <DashboardDetailModal
      eyebrow="Training streak"
      eyebrowColor={colors.gold}
      onClose={onClose}
      subtitle={metrics?.delta.label}
      title={streakTitle}
      visible={visible}
    >
      {isLoading || !metrics ? (
        <DashboardDetailSection title="Streak">
          <DashboardDetailRow label="Current streak" value="—" />
          <DashboardDetailRow label="Longest streak" value="—" />
          <DashboardDetailRow label="Training days this week" value="—" />
          <DashboardDetailRow label="Status" value="Loading…" />
        </DashboardDetailSection>
      ) : (
        <DashboardDetailSection title="Streak">
          <DashboardDetailRow
            label="Current streak"
            value={`${metrics.currentStreak} days`}
            valueColor={colors.gold}
          />
          <DashboardDetailRow
            label="Longest streak"
            value={`${metrics.longestStreak} days`}
            valueColor={colors.gold}
          />
          <DashboardDetailRow
            label="Training days this week"
            value={String(metrics.trainingDaysThisWeek)}
          />
          <DashboardDetailRow
            label="Status"
            value={metrics.delta.label}
            valueColor={
              metrics.delta.tone === 'positive'
                ? colors.accent
                : metrics.delta.tone === 'negative'
                  ? '#ff5f5f'
                  : colors.muted
            }
          />
        </DashboardDetailSection>
      )}
    </DashboardDetailModal>
  );
}
