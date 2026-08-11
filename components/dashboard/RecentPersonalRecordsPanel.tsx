import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Trophy } from 'lucide-react-native';

import { AllPersonalRecordsModal } from '@/components/dashboard/AllPersonalRecordsModal';
import { InsightSectionHeading } from '@/components/dashboard/InsightSectionHeading';
import { PersonalRecordDetailModal } from '@/components/dashboard/PersonalRecordDetailModal';
import { QueryError } from '@/components/ui/QueryState';
import { colors, fonts } from '@/constants/theme';
import {
  DASHBOARD_TILE_BG,
  dashboardCardFrameStyle,
  dashboardPressStyle,
  dashboardTileWebClassName,
  useDashboardTilePress,
} from '@/lib/dashboard/cardStyles';
import { useDashboardRecentPRs } from '@/hooks/useDashboardRecentPRs';
import type { DashboardRecentPR } from '@/lib/dashboard/recentPRs';
import { getSupabaseErrorMessage } from '@/lib/supabase/errors';

const GOLD = '#f5c842';
const MUTED = 'rgba(240,237,232,0.5)';

function PRCard({
  record,
  onPress,
}: {
  record: DashboardRecentPR;
  onPress: () => void;
}) {
  const { pressed, handlers } = useDashboardTilePress(onPress);
  const valueLabel = record.displayValue;

  return (
    <Pressable
      accessibilityRole="button"
      className={dashboardTileWebClassName()}
      {...handlers}
      style={{
        alignSelf: 'stretch',
        backgroundColor: DASHBOARD_TILE_BG,
        borderWidth: 1,
        cursor: Platform.OS === 'web' ? ('pointer' as const) : undefined,
        flexDirection: 'row',
        gap: 10,
        minWidth: 0,
        paddingHorizontal: 12,
        paddingVertical: 10,
        width: '100%',
        ...dashboardCardFrameStyle(10),
        ...dashboardPressStyle(pressed),
      }}
    >
      <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{
            color: colors.text,
            fontFamily: fonts.jetbrainsMono,
            fontSize: 12,
          }}
        >
          {record.exerciseName}
        </Text>

        <Text
          numberOfLines={1}
          style={{
            color: MUTED,
            fontFamily: fonts.jetbrainsMono,
            fontSize: 10,
          }}
        >
          {record.timeAgo}
        </Text>
      </View>

      <Text
        numberOfLines={1}
        style={{
          color: GOLD,
          fontFamily: fonts.jetbrainsMono,
          fontSize: 13,
          fontWeight: '600',
        }}
      >
        {valueLabel}
      </Text>
    </Pressable>
  );
}

function PREmptyCard({ onPress }: { onPress: () => void }) {
  const { pressed, handlers } = useDashboardTilePress(onPress);

  return (
    <Pressable
      accessibilityRole="button"
      className={dashboardTileWebClassName()}
      {...handlers}
      style={{
        alignSelf: 'stretch',
        backgroundColor: DASHBOARD_TILE_BG,
        borderWidth: 1,
        cursor: Platform.OS === 'web' ? ('pointer' as const) : undefined,
        paddingHorizontal: 12,
        paddingVertical: 16,
        width: '100%',
        ...dashboardCardFrameStyle(10),
        ...dashboardPressStyle(pressed),
      }}
    >
      <Text
        style={{
          color: MUTED,
          fontFamily: fonts.body,
          fontSize: 12,
        }}
      >
        Complete a workout and hit a PR to see it here.
      </Text>
    </Pressable>
  );
}

function PRList({
  records,
  onRecordPress,
}: {
  records: DashboardRecentPR[];
  onRecordPress: (record: DashboardRecentPR) => void;
}) {
  return (
    <View className="w-full" style={{ gap: 10 }}>
      {records.map((record) => (
        <PRCard
          key={record.id}
          onPress={() => onRecordPress(record)}
          record={record}
        />
      ))}
    </View>
  );
}

interface RecentPersonalRecordsPanelProps {
  unit?: 'kg' | 'lb';
}

const RECENT_PRS_HEADING = 'RECENT PRs';

function RecentPRHeading({ onViewAll }: { onViewAll?: () => void }) {
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center" style={{ gap: 6 }}>
        <Trophy color={GOLD} size={12} strokeWidth={2.5} />
        <InsightSectionHeading title={RECENT_PRS_HEADING} uppercase={false} />
      </View>
      {onViewAll ? (
        <Pressable accessibilityRole="button" onPress={onViewAll}>
          <Text
            style={{
              color: colors.accent,
              fontFamily: fonts.body,
              fontSize: 12,
            }}
          >
            View all
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function RecentPersonalRecordsPanel({
  unit = 'kg',
}: RecentPersonalRecordsPanelProps) {
  const { data, isLoading, isError, error, refetch } = useDashboardRecentPRs(unit);
  const [selectedRecord, setSelectedRecord] = useState<DashboardRecentPR | null>(
    null,
  );
  const [detailVisible, setDetailVisible] = useState(false);
  const [allVisible, setAllVisible] = useState(false);

  const recentRecords = data?.recent ?? [];
  const groupedRecords = data?.grouped ?? [];
  const totalCount = data?.totalCount ?? 0;

  const openAll = () => {
    setAllVisible(true);
  };

  const openRecord = (record: DashboardRecentPR) => {
    setSelectedRecord(record);
    setDetailVisible(true);
  };

  const closeDetail = () => {
    setDetailVisible(false);
    setSelectedRecord(null);
  };

  const closeAll = () => {
    setAllVisible(false);
  };

  if (isLoading) {
    return (
      <View className="w-full" style={{ gap: 12 }}>
        <RecentPRHeading />
        <View className="items-center py-6">
          <ActivityIndicator color={colors.accent} size="small" />
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="w-full" style={{ gap: 12 }}>
        <RecentPRHeading />
        <QueryError
          message={getSupabaseErrorMessage(error)}
          onRetry={() => void refetch()}
        />
      </View>
    );
  }

  return (
    <>
      <View className="w-full" style={{ gap: 12, position: 'relative', zIndex: 1 }}>
        <RecentPRHeading onViewAll={openAll} />

        {!recentRecords.length ? (
          <PREmptyCard onPress={openAll} />
        ) : (
          <PRList onRecordPress={openRecord} records={recentRecords} />
        )}
      </View>

      <AllPersonalRecordsModal
        grouped={groupedRecords}
        onClose={closeAll}
        totalCount={totalCount}
        visible={allVisible}
      />

      <PersonalRecordDetailModal
        allRecords={recentRecords}
        onClose={closeDetail}
        record={selectedRecord}
        visible={detailVisible}
      />
    </>
  );
}
