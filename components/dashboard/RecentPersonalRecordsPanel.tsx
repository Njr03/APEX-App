import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';

import { InsightSectionHeading } from '@/components/dashboard/InsightSectionHeading';
import { PersonalRecordDetailModal } from '@/components/dashboard/PersonalRecordDetailModal';
import { QueryError } from '@/components/ui/QueryState';
import { colors, fonts } from '@/constants/theme';
import {
  DASHBOARD_TILE_BG,
  dashboardCardFrameStyle,
  dashboardHoverStyle,
  dashboardTileHoverHandlers,
  dashboardTileWebClassName,
} from '@/lib/dashboard/cardStyles';
import { useDashboardRecentPRs } from '@/hooks/useDashboardRecentPRs';
import type { DashboardRecentPR } from '@/lib/dashboard/recentPRs';
import { getSupabaseErrorMessage } from '@/lib/supabase/errors';
const GOLD = '#f5c842';
const ICON_BG = 'rgba(245,200,66,0.10)';
const ICON_BORDER = 'rgba(245,200,66,0.20)';
const MUTED = 'rgba(240,237,232,0.5)';

function PRCard({
  record,
  onPress,
}: {
  record: DashboardRecentPR;
  onPress: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const valueLabel = record.weightDisplayValue;

  return (
    <Pressable
      accessibilityRole="button"
      className={dashboardTileWebClassName()}
      {...dashboardTileHoverHandlers(setHovered, onPress)}
      style={{
        alignItems: 'center',
        alignSelf: 'stretch',
        backgroundColor: DASHBOARD_TILE_BG,
        borderWidth: 1,
        cursor: Platform.OS === 'web' ? ('pointer' as const) : undefined,
        flex: 1,
        flexDirection: 'row',
        gap: 10,
        minWidth: 0,
        paddingHorizontal: 12,
        paddingVertical: 10,
        width: '100%',
        ...dashboardCardFrameStyle(10),
        ...dashboardHoverStyle(hovered),
      }}
    >
      <View
        style={{
          alignItems: 'center',
          backgroundColor: ICON_BG,
          borderColor: ICON_BORDER,
          borderRadius: 8,
          borderWidth: 1,
          height: 34,
          justifyContent: 'center',
          width: 34,
        }}
      >
        <Text style={{ fontSize: 16, lineHeight: 18 }}>🏆</Text>
      </View>

      <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
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

        <View className="flex-row items-center" style={{ gap: 6 }}>
          <View
            style={{
              backgroundColor: record.splitColor,
              borderRadius: 999,
              height: 8,
              width: 8,
            }}
          />
          <Text
            numberOfLines={1}
            style={{
              color: MUTED,
              fontFamily: fonts.jetbrainsMono,
              fontSize: 10,
            }}
          >
            {record.splitLabel} · {record.timeAgo}
          </Text>
        </View>
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
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      className={dashboardTileWebClassName()}
      {...dashboardTileHoverHandlers(setHovered, onPress)}
      style={{
        alignSelf: 'stretch',
        backgroundColor: DASHBOARD_TILE_BG,
        borderWidth: 1,
        cursor: Platform.OS === 'web' ? ('pointer' as const) : undefined,
        paddingHorizontal: 12,
        paddingVertical: 16,
        width: '100%',
        ...dashboardCardFrameStyle(10),
        ...dashboardHoverStyle(hovered),
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

function PRGrid({
  records,
  onRecordPress,
}: {
  records: DashboardRecentPR[];
  onRecordPress: (record: DashboardRecentPR) => void;
}) {
  const topRow = records.slice(0, 2);
  const bottomRow = records.slice(2, 4);

  const renderRow = (row: DashboardRecentPR[]) => (
    <View className="w-full flex-row" style={{ gap: 12 }}>
      {row.map((record) => (
        <View key={record.exerciseId} style={{ flex: 1, minWidth: 0 }}>
          <PRCard onPress={() => onRecordPress(record)} record={record} />
        </View>
      ))}
      {row.length === 1 ? <View style={{ flex: 1, minWidth: 0 }} /> : null}
    </View>
  );

  return (
    <View className="w-full" style={{ gap: 12 }}>
      {topRow.length > 0 ? renderRow(topRow) : null}
      {bottomRow.length > 0 ? renderRow(bottomRow) : null}
    </View>
  );
}

interface RecentPersonalRecordsPanelProps {
  unit?: 'kg' | 'lb';
}

export function RecentPersonalRecordsPanel({
  unit = 'kg',
}: RecentPersonalRecordsPanelProps) {
  const { data, isLoading, isError, error, refetch } = useDashboardRecentPRs(unit);
  const [selectedRecord, setSelectedRecord] = useState<DashboardRecentPR | null>(
    null,
  );
  const [modalVisible, setModalVisible] = useState(false);

  const openSummary = () => {
    setSelectedRecord(null);
    setModalVisible(true);
  };

  const openRecord = (record: DashboardRecentPR) => {
    setSelectedRecord(record);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedRecord(null);
  };

  if (isLoading) {
    return (
      <View className="w-full" style={{ gap: 12 }}>
        <InsightSectionHeading title="Recent Personal Records" />
        <View className="items-center py-6">
          <ActivityIndicator color={colors.accent} size="small" />
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="w-full" style={{ gap: 12 }}>
        <InsightSectionHeading title="Recent Personal Records" />
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
        <Pressable accessibilityRole="button" onPress={openSummary}>
          <InsightSectionHeading title="Recent Personal Records" />
        </Pressable>

        {!data?.length ? (
          <PREmptyCard onPress={openSummary} />
        ) : (
          <PRGrid onRecordPress={openRecord} records={data} />
        )}
      </View>

      <PersonalRecordDetailModal
        allRecords={data ?? []}
        onClose={closeModal}
        record={selectedRecord}
        visible={modalVisible}
      />
    </>
  );
}
