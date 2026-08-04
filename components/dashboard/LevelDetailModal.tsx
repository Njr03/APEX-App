import {
  DashboardDetailModal,
  DashboardDetailRow,
  DashboardDetailSection,
} from '@/components/dashboard/DashboardDetailModal';
import { useProfile } from '@/hooks/queries';
import { colors } from '@/constants/theme';
import { xpProgressInLevel } from '@/lib/xp';

interface LevelDetailModalProps {
  visible: boolean;
  onClose: () => void;
}

export function LevelDetailModal({ visible, onClose }: LevelDetailModalProps) {
  const { data: profile } = useProfile();

  const totalXp = profile?.total_xp ?? 0;
  const xpProgress = xpProgressInLevel(totalXp);
  const nextLevelXp = (xpProgress.level + 1) * (xpProgress.level + 1) * 100;

  return (
    <DashboardDetailModal
      eyebrow="Progress"
      eyebrowColor={colors.gold}
      onClose={onClose}
      subtitle={`${totalXp.toLocaleString('en-US')} total XP`}
      title={`Level ${xpProgress.level}`}
      visible={visible}
    >
      <DashboardDetailSection title="Level">
        <DashboardDetailRow
          label="Current level"
          value={String(xpProgress.level)}
          valueColor={colors.gold}
        />
        <DashboardDetailRow
          label="Total XP"
          value={totalXp.toLocaleString('en-US')}
        />
        <DashboardDetailRow
          label="XP in this level"
          value={`${xpProgress.current} / ${xpProgress.needed}`}
        />
        <DashboardDetailRow
          label="Level progress"
          value={`${Math.round(xpProgress.percent)}%`}
          valueColor={colors.accent}
        />
        <DashboardDetailRow
          label="Next level at"
          value={`${nextLevelXp.toLocaleString('en-US')} XP`}
        />
      </DashboardDetailSection>
    </DashboardDetailModal>
  );
}
