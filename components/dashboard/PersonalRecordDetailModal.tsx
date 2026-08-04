import { format, parseISO } from 'date-fns';

import {
  DashboardDetailModal,
  DashboardDetailRow,
  DashboardDetailSection,
} from '@/components/dashboard/DashboardDetailModal';
import type { DashboardRecentPR } from '@/lib/dashboard/recentPRs';

interface PersonalRecordDetailModalProps {
  record: DashboardRecentPR | null;
  allRecords: DashboardRecentPR[];
  visible: boolean;
  onClose: () => void;
}

export function PersonalRecordDetailModal({
  record,
  allRecords,
  visible,
  onClose,
}: PersonalRecordDetailModalProps) {
  const isSummary = record == null;

  return (
    <DashboardDetailModal
      eyebrow="Personal record"
      eyebrowColor="#f5c842"
      onClose={onClose}
      subtitle={
        isSummary
          ? `${allRecords.length} recent records`
          : `${record.splitLabel} · ${record.timeAgo}`
      }
      title={isSummary ? 'Recent Personal Records' : record.exerciseName}
      visible={visible}
    >
      {isSummary ? (
        <>
          <DashboardDetailSection title="Latest highlights">
            {allRecords.length === 0 ? (
              <DashboardDetailRow
                label="Status"
                value="Complete a workout and hit a PR to see records here."
              />
            ) : (
              allRecords.map((entry) => (
                <DashboardDetailRow
                  key={entry.exerciseId}
                  label={entry.exerciseName}
                  value={entry.displayValue}
                  valueColor="#f5c842"
                />
              ))
            )}
          </DashboardDetailSection>
        </>
      ) : (
        <>
          <DashboardDetailSection title="Record details">
            <DashboardDetailRow
              label="Best set"
              value={record.displayValue}
              valueColor="#f5c842"
            />
            {record.improvementLabel ? (
              <DashboardDetailRow
                label="Estimated 1RM gain"
                value={record.improvementLabel}
                valueColor="#c8ff5a"
              />
            ) : null}
            <DashboardDetailRow
              label="Achieved"
              value={format(parseISO(record.achievedAt), 'EEEE, MMM d, yyyy')}
            />
            <DashboardDetailRow label="Workout split" value={record.splitLabel} />
          </DashboardDetailSection>
        </>
      )}
    </DashboardDetailModal>
  );
}
