import { Text, View } from 'react-native';

import {
  DashboardDetailModal,
  DashboardDetailSection,
} from '@/components/dashboard/DashboardDetailModal';
import { colors, fonts } from '@/constants/theme';
import {
  formatPRLineSummary,
  type GroupedMusclePRs,
} from '@/lib/dashboard/recentPRs';

interface AllPersonalRecordsModalProps {
  grouped: GroupedMusclePRs[];
  totalCount: number;
  visible: boolean;
  onClose: () => void;
}

const GOLD = '#f5c842';
const MUTED = 'rgba(240,237,232,0.5)';
const DIVIDER = 'rgba(255,255,255,0.06)';

function ExercisePRBlock({
  exerciseName,
  records,
}: {
  exerciseName: string;
  records: GroupedMusclePRs['exercises'][number]['records'];
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text
        style={{
          color: colors.text,
          fontFamily: fonts.bodySemiBold,
          fontSize: 12,
        }}
      >
        {exerciseName}
      </Text>
      <View style={{ gap: 4, paddingLeft: 2 }}>
        {records.map((record) => (
          <Text
            key={record.id}
            style={{
              color: GOLD,
              fontFamily: fonts.jetbrainsMono,
              fontSize: 10,
            }}
          >
            {formatPRLineSummary(record)}
          </Text>
        ))}
      </View>
    </View>
  );
}

export function AllPersonalRecordsModal({
  grouped,
  totalCount,
  visible,
  onClose,
}: AllPersonalRecordsModalProps) {
  const exerciseCount = grouped.reduce(
    (count, section) => count + section.exercises.length,
    0,
  );

  return (
    <DashboardDetailModal
      eyebrow="Personal records"
      eyebrowColor={GOLD}
      onClose={onClose}
      subtitle={`${totalCount} records · ${exerciseCount} exercises`}
      title="All Personal Records"
      visible={visible}
    >
      {grouped.length === 0 ? (
        <DashboardDetailSection title="Records">
          <Text style={{ color: MUTED, fontFamily: fonts.body, fontSize: 12 }}>
            Complete a workout and hit a PR to see records here.
          </Text>
        </DashboardDetailSection>
      ) : (
        grouped.map((section) => (
          <DashboardDetailSection key={section.muscleGroup} title={section.label}>
            <View style={{ gap: 12 }}>
              {section.exercises.map((exercise, index) => (
                <View key={exercise.exerciseId} style={{ gap: 12 }}>
                  <ExercisePRBlock
                    exerciseName={exercise.exerciseName}
                    records={exercise.records}
                  />
                  {index < section.exercises.length - 1 ? (
                    <View style={{ backgroundColor: DIVIDER, height: 1 }} />
                  ) : null}
                </View>
              ))}
            </View>
          </DashboardDetailSection>
        ))
      )}
    </DashboardDetailModal>
  );
}
