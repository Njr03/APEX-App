import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Trophy, X } from 'lucide-react-native';

import { colors, fonts } from '@/constants/theme';
import type { AllTimePRRow } from '@/lib/progress/allTimePRs';

const CARD_BG = '#141427';
const CARD_BORDER = 'rgba(255,255,255,0.06)';

function PRRow({ record }: { record: AllTimePRRow }) {
  return (
    <View className="flex-row items-center" style={{ gap: 10, paddingVertical: 10 }}>
      <View
        style={{
          backgroundColor: record.splitColor,
          borderRadius: 999,
          height: 6,
          width: 6,
        }}
      />
      <Text
        className="flex-1"
        numberOfLines={1}
        style={{
          color: colors.text,
          fontFamily: fonts.bodyMedium,
          fontSize: 12,
          fontWeight: '500',
        }}
      >
        {record.exerciseName}
      </Text>
      <Text
        style={{
          color: record.splitColor,
          fontFamily: fonts.jetbrainsMono,
          fontSize: 12,
          fontWeight: '600',
        }}
      >
        {record.displayValue}
      </Text>
    </View>
  );
}

function PRList({ records }: { records: AllTimePRRow[] }) {
  return records.map((record, index) => (
    <View key={record.id}>
      <PRRow record={record} />
      {index < records.length - 1 ? (
        <View style={{ backgroundColor: CARD_BORDER, height: 1 }} />
      ) : null}
    </View>
  ));
}

export function AllTimePRsPanel({ records }: { records: AllTimePRRow[] }) {
  const [modalVisible, setModalVisible] = useState(false);
  const topFive = records.slice(0, 5);

  return (
    <>
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
          <Trophy color={colors.gold} size={16} />
          <Text
            style={{
              color: colors.text,
              fontFamily: fonts.jetbrainsMono,
              fontSize: 9,
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            All-Time PRs
          </Text>
        </View>

        {topFive.length === 0 ? (
          <Text style={{ color: colors.muted, fontFamily: fonts.body, fontSize: 12 }}>
            Hit a personal record to see it here.
          </Text>
        ) : (
          <>
            <PRList records={topFive} />
            {records.length > 5 ? (
              <Pressable onPress={() => setModalVisible(true)}>
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
          </>
        )}
      </View>

      <Modal animationType="slide" visible={modalVisible}>
        <View className="flex-1 bg-bg">
          <View className="flex-row items-center justify-between border-b border-border px-5 py-4">
            <Text
              style={{
                color: colors.text,
                fontFamily: fonts.display,
                fontSize: 20,
              }}
            >
              All-Time PRs
            </Text>
            <Pressable onPress={() => setModalVisible(false)}>
              <X color={colors.text} size={22} />
            </Pressable>
          </View>
          <ScrollView contentContainerClassName="p-5 pb-10">
            <PRList records={records} />
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}
