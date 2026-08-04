import {
  DashboardDetailModal,
  DashboardDetailRow,
  DashboardDetailSection,
} from '@/components/dashboard/DashboardDetailModal';
import type { StatTileBreakdown, StatTileData } from '@/hooks/useDashboardStatTiles';
import { colors } from '@/constants/theme';
import {
  formatStatVolumeK,
  formatVolumeDeltaPercent,
} from '@/lib/dashboard/statTiles';
import { kgToDisplay, volumeLabel } from '@/lib/units';

interface StatTileDetailModalProps {
  tile: StatTileData | null;
  breakdown: StatTileBreakdown | null;
  unit: 'kg' | 'lb';
  visible: boolean;
  onClose: () => void;
}

function formatVolume(kg: number, unit: 'kg' | 'lb'): string {
  const formatted = formatStatVolumeK(kg, unit);
  return `${formatted.value}${formatted.unit}`.trim();
}

export function StatTileDetailModal({
  tile,
  breakdown,
  unit,
  visible,
  onClose,
}: StatTileDetailModalProps) {
  if (!tile || !breakdown) return null;

  const renderContent = () => {
    switch (tile.label) {
      case 'Streak': {
        const data = breakdown.streak;
        return (
          <DashboardDetailSection title="Streak">
            <DashboardDetailRow
              label="Current streak"
              value={`${data.currentStreak} days`}
              valueColor={tile.accentColor}
            />
            <DashboardDetailRow
              label="Longest streak"
              value={`${data.longestStreak} days`}
              valueColor={colors.gold}
            />
            <DashboardDetailRow
              label="Training days this week"
              value={String(data.trainingDaysThisWeek)}
            />
            <DashboardDetailRow
              label="Status"
              value={tile.delta}
              valueColor={
                tile.deltaTone === 'positive'
                  ? colors.accent
                  : tile.deltaTone === 'negative'
                    ? '#ff5f5f'
                    : colors.muted
              }
            />
          </DashboardDetailSection>
        );
      }
      case "This Week's Volume": {
        const data = breakdown.volume;
        const delta = formatVolumeDeltaPercent(data.deltaPercent);
        return (
          <>
            <DashboardDetailSection title="This week">
              <DashboardDetailRow
                label="Total volume"
                value={formatVolume(data.thisWeekKg, unit)}
                valueColor={tile.accentColor}
              />
              <DashboardDetailRow
                label="Sessions logged"
                value={String(data.sessionsThisWeek)}
              />
              <DashboardDetailRow
                label="Vs last week"
                value={delta.label}
                valueColor={
                  delta.tone === 'positive'
                    ? colors.accent
                    : delta.tone === 'negative'
                      ? '#ff5f5f'
                      : colors.muted
                }
              />
            </DashboardDetailSection>
            <DashboardDetailSection title="Last week">
              <DashboardDetailRow
                label="Total volume"
                value={formatVolume(data.lastWeekKg, unit)}
              />
              <DashboardDetailRow
                label="Change"
                value={`${data.deltaKg >= 0 ? '+' : ''}${kgToDisplay(data.deltaKg, unit)} ${volumeLabel(unit)}`}
              />
            </DashboardDetailSection>
          </>
        );
      }
      case 'Sessions This Year': {
        const data = breakdown.sessions;
        return (
          <DashboardDetailSection title="Year to date">
            <DashboardDetailRow
              label="Completed sessions"
              value={String(data.completedYtd)}
              valueColor={tile.accentColor}
            />
            <DashboardDetailRow
              label="Planned sessions"
              value={String(data.plannedYtd)}
            />
            <DashboardDetailRow
              label="Plan completion"
              value={`${data.completionPercent}%`}
              valueColor={
                data.completionPercent >= 100 ? colors.accent : colors.muted
              }
            />
            <DashboardDetailRow label="Target pace" value={tile.delta} />
          </DashboardDetailSection>
        );
      }
      case 'Total PRs': {
        const data = breakdown.prs;
        return (
          <DashboardDetailSection title="Personal records">
            <DashboardDetailRow
              label="All-time PRs"
              value={String(data.total)}
              valueColor={tile.accentColor}
            />
            <DashboardDetailRow
              label="This month"
              value={String(data.thisMonth)}
              valueColor={data.thisMonth > 0 ? colors.gold : colors.muted}
            />
            <DashboardDetailRow label="Recent activity" value={tile.delta} />
          </DashboardDetailSection>
        );
      }
      default:
        return null;
    }
  };

  return (
    <DashboardDetailModal
      eyebrow={tile.label}
      eyebrowColor={tile.accentColor}
      onClose={onClose}
      subtitle={`${tile.value}${tile.unit ?? ''} · ${tile.delta}`}
      title={tile.label}
      visible={visible}
    >
      {renderContent()}
    </DashboardDetailModal>
  );
}
