import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import { Play } from 'lucide-react-native';

import { AppText } from '@/components/ui/AppText';
import { QueryError } from '@/components/ui/QueryState';
import { useThisWeekSplits } from '@/hooks/useThisWeekSplits';
import { colors, fonts } from '@/constants/theme';
import {
  splitDimBackground,
  splitHoverBorder,
  splitHoverGlow,
  splitSessionTag,
} from '@/lib/training/splitSelectorMeta';
import {
  SPLIT_DEFINITIONS,
  WEEKLY_SPLIT_ORDER,
  type TrainingSplit,
} from '@/lib/training/splits';
import {
  formatSplitDuration,
  formatSplitVolume,
} from '@/lib/training/weekSplits';
import { getSupabaseErrorMessage } from '@/lib/supabase/errors';

const CARD_BG = '#0d0d1b';
const DEFAULT_BORDER = 'rgba(255,255,255,0.06)';
const MUTED = 'rgba(240,237,232,0.5)';
const LIME = '#c8ff5a';
const TEXT_DARK = '#08080f';

const HEADING_STYLE = {
  color: MUTED,
  fontFamily: fonts.brand,
  fontSize: 11,
  letterSpacing: 1.5,
  textTransform: 'uppercase' as const,
};

interface SplitSelectionCardProps {
  split: TrainingSplit;
  onSelect: (split: TrainingSplit) => void;
}

function SplitSelectionCard({ split, onSelect }: SplitSelectionCardProps) {
  const definition = SPLIT_DEFINITIONS[split];
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Start ${definition.name}`}
      className={Platform.OS === 'web' ? 'split-selector-card' : undefined}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={() => onSelect(split)}
      style={{
        alignItems: 'center',
        backgroundColor: CARD_BG,
        borderColor: hovered ? splitHoverBorder(split) : DEFAULT_BORDER,
        borderRadius: 16,
        borderWidth: 1,
        flex: 1,
        justifyContent: 'center',
        minHeight: 168,
        paddingHorizontal: 20,
        paddingVertical: 20,
        transform: [{ translateY: hovered ? -3 : 0 }],
        ...(Platform.OS === 'web' && hovered
          ? { boxShadow: `0 0 32px ${splitHoverGlow(split)}` }
          : {}),
      }}
    >
      <Text
        style={{
          color: definition.color,
          fontFamily: fonts.brand,
          fontSize: 16,
          fontWeight: '700',
          marginBottom: 4,
          textAlign: 'center',
        }}
      >
        {definition.name}
      </Text>

      <Text
        style={{
          color: MUTED,
          fontFamily: fonts.body,
          fontSize: 11,
          marginBottom: 14,
          textAlign: 'center',
        }}
      >
        {definition.muscles}
      </Text>

      <View
        style={{
          backgroundColor: splitDimBackground(split),
          borderColor: `${definition.color}55`,
          borderRadius: 20,
          borderWidth: 1,
          paddingHorizontal: 10,
          paddingVertical: 4,
        }}
      >
        <Text
          style={{
            color: definition.color,
            fontFamily: fonts.jetbrainsMono,
            fontSize: 9,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
          }}
        >
          {splitSessionTag(split)}
        </Text>
      </View>
    </Pressable>
  );
}

interface SuggestedSessionCardProps {
  split: TrainingSplit;
  unit: 'kg' | 'lb';
  onStart: (split: TrainingSplit) => void;
}

function SuggestedSessionCard({ split, unit, onStart }: SuggestedSessionCardProps) {
  const definition = SPLIT_DEFINITIONS[split];
  const { data } = useThisWeekSplits();
  const card = data?.cards.find((entry) => entry.definition.id === split);
  const lastSession = card?.lastSession ?? card?.completedSession;

  const statsLine = lastSession
    ? `${formatSplitVolume(lastSession.totalVolume, unit)} · ${formatSplitDuration(lastSession.durationSeconds)} · ${
        lastSession.prCount === 1
          ? '1 PR'
          : `${lastSession.prCount} PRs`
      }`
    : 'No prior session logged';

  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: CARD_BG,
        borderColor: DEFAULT_BORDER,
        borderRadius: 16,
        borderWidth: 1,
        flexDirection: 'row',
        gap: 14,
        paddingHorizontal: 18,
        paddingVertical: 16,
      }}
    >
      <View
        className={Platform.OS === 'web' ? 'pulse-today-dot' : undefined}
        style={{
          backgroundColor: definition.color,
          borderRadius: 999,
          height: 8,
          width: 8,
        }}
      />

      <View style={{ flex: 1, gap: 4 }}>
        <Text
          style={{
            color: colors.text,
            fontFamily: fonts.brand,
            fontSize: 14,
            fontWeight: '600',
          }}
        >
          Suggested: {definition.name}
        </Text>
        <Text
          style={{
            color: MUTED,
            fontFamily: fonts.jetbrainsMono,
            fontSize: 11,
          }}
        >
          {statsLine}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Start suggested workout"
        onPress={() => onStart(split)}
        style={{
          alignItems: 'center',
          backgroundColor: LIME,
          borderRadius: 10,
          flexDirection: 'row',
          gap: 6,
          paddingHorizontal: 14,
          paddingVertical: 10,
        }}
      >
        <Play color={TEXT_DARK} fill={TEXT_DARK} size={14} />
        <Text
          style={{
            color: TEXT_DARK,
            fontFamily: fonts.brand,
            fontSize: 13,
            fontWeight: '700',
          }}
        >
          Start Now
        </Text>
      </Pressable>
    </View>
  );
}

interface SplitSelectorProps {
  unit?: 'kg' | 'lb';
}

export function SplitSelector({ unit = 'kg' }: SplitSelectorProps) {
  const { data, isLoading, isError, error, refetch } = useThisWeekSplits();

  const suggestedSplit = useMemo((): TrainingSplit => {
    if (!data) return 'A';
    const today = data.cards.find((card) => card.status === 'today');
    if (today) return today.definition.id;
    const upcoming = data.cards.find((card) => card.status === 'upcoming');
    return upcoming?.definition.id ?? 'A';
  }, [data]);

  const handleSelectSplit = (split: TrainingSplit) => {
    router.push({
      pathname: '/workout/confirm',
      params: { split },
    });
  };

  if (isLoading) {
    return (
      <View className="items-center py-10">
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (isError) {
    return (
      <QueryError
        message={getSupabaseErrorMessage(error)}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <View className="gap-4">
      <AppText style={HEADING_STYLE}>Start a session</AppText>

      <View className="flex-row" style={{ gap: 12 }}>
        {WEEKLY_SPLIT_ORDER.map((split) => (
          <SplitSelectionCard
            key={split}
            onSelect={handleSelectSplit}
            split={split}
          />
        ))}
      </View>

      <SuggestedSessionCard
        onStart={handleSelectSplit}
        split={suggestedSplit}
        unit={unit}
      />
    </View>
  );
}
