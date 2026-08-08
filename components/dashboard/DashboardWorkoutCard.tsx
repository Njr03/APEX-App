import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Platform, Pressable, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';

import {
  DASHBOARD_WORKOUT_CARD_RADIUS,
  dashboardPressStyle,
  dashboardTileWebClassName,
  useDashboardTilePress,
} from '@/lib/dashboard/cardStyles';
import type { DashboardWorkoutCardModel } from '@/lib/dashboard/routineCardDisplay';
import {
  formatPrCount,
  formatSplitDay,
  formatSplitDuration,
  formatSplitVolume,
} from '@/lib/training/weekSplits';
import { colors, fonts } from '@/constants/theme';

const CARD_BG = '#0d0d1b';
const BORDER = 'rgba(255,255,255,0.08)';
const MUTED = 'rgba(240,237,232,0.5)';
const LIME = '#c8ff5a';

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const value =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized;
  const int = Number.parseInt(value, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function StatRow({
  label,
  value,
  valueColor = colors.text,
  compact = false,
}: {
  label: string;
  value: string;
  valueColor?: string;
  compact?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Text
        style={{
          color: MUTED,
          fontFamily: fonts.body,
          fontSize: compact ? 9 : 10,
        }}
      >
        {label}
      </Text>
      <Text
        numberOfLines={1}
        style={{
          color: valueColor,
          fontFamily: fonts.jetbrainsMono,
          fontSize: compact ? 10 : 11,
          fontWeight: '500',
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function FlickerDot({ color }: { color: string }) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.15,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [opacity]);

  if (Platform.OS === 'web') {
    return (
      <View
        className="today-dot-flicker"
        style={{
          backgroundColor: color,
          borderRadius: 999,
          height: 6,
          width: 6,
        }}
      />
    );
  }

  return (
    <Animated.View
      style={{
        backgroundColor: color,
        borderRadius: 999,
        height: 6,
        opacity,
        width: 6,
      }}
    />
  );
}

function StatusBadge({
  status,
  color,
  splitId,
  compact,
}: {
  status: DashboardWorkoutCardModel['status'];
  color: string;
  splitId?: DashboardWorkoutCardModel['splitId'];
  compact?: boolean;
}) {
  if (status === 'completed') {
    return (
      <View
        className="flex-row items-center gap-1.5 self-start rounded-full"
        style={{
          backgroundColor: 'rgba(200,255,90,0.1)',
          borderColor: LIME,
          borderWidth: 1,
          paddingHorizontal: compact ? 8 : 10,
          paddingVertical: compact ? 3 : 4,
        }}
      >
        <Check color={LIME} size={compact ? 10 : 12} strokeWidth={3} />
        <Text
          style={{
            color: LIME,
            fontFamily: fonts.jetbrainsMono,
            fontSize: compact ? 8 : 9,
            letterSpacing: 1.2,
          }}
        >
          COMPLETED
        </Text>
      </View>
    );
  }

  if (status === 'template') {
    return (
      <View
        className="flex-row items-center gap-1.5 self-start rounded-full"
        style={{
          backgroundColor: hexToRgba(color, 0.1),
          borderColor: color,
          borderWidth: 1,
          paddingHorizontal: compact ? 8 : 10,
          paddingVertical: compact ? 3 : 4,
        }}
      >
        <Text
          style={{
            color,
            fontFamily: fonts.jetbrainsMono,
            fontSize: compact ? 8 : 9,
            letterSpacing: 1.2,
          }}
        >
          BEGIN WORKOUT
        </Text>
      </View>
    );
  }

  if (status === 'today') {
    return (
      <View className="flex-row flex-wrap items-center gap-2">
        <View
          style={{
            alignSelf: 'flex-start',
            backgroundColor: hexToRgba(color, 0.12),
            borderColor: hexToRgba(color, 0.35),
            borderRadius: 999,
            borderWidth: 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <FlickerDot color={color} />
          <Text
            style={{
              color,
              fontFamily: fonts.jetbrainsMono,
              fontSize: compact ? 8 : 9,
              letterSpacing: 1.2,
            }}
          >
            TODAY
          </Text>
        </View>

        {splitId ? (
          <Pressable
            accessibilityRole="button"
            onPress={(event) => {
              event.stopPropagation?.();
              router.push({
                pathname: '/workout/confirm',
                params: { split: splitId },
              });
            }}
            style={{
              backgroundColor: color,
              borderRadius: 999,
              paddingHorizontal: 12,
              paddingVertical: 5,
            }}
          >
            <Text
              style={{
                color: '#07070f',
                fontFamily: fonts.jetbrainsMono,
                fontSize: compact ? 8 : 9,
                fontWeight: '500',
                letterSpacing: 0.5,
              }}
            >
              Start Now
            </Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View
      className="self-start rounded-full"
      style={{
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        paddingHorizontal: compact ? 8 : 10,
        paddingVertical: compact ? 3 : 4,
      }}
    >
      <Text
        style={{
          color: MUTED,
          fontFamily: fonts.jetbrainsMono,
          fontSize: compact ? 8 : 9,
          letterSpacing: 1.2,
        }}
      >
        UPCOMING
      </Text>
    </View>
  );
}

function CardStats({
  model,
  unit,
  compact,
}: {
  model: DashboardWorkoutCardModel;
  unit: 'kg' | 'lb';
  compact?: boolean;
}) {
  const { status, completedSession, lastSession, color, exerciseCount, lastUsedLabel } =
    model;

  if (status === 'completed' && completedSession) {
    return (
      <>
        <StatRow compact={compact} label="Day" value={formatSplitDay(completedSession.startedAt)} />
        <StatRow
          compact={compact}
          label="Volume"
          value={formatSplitVolume(completedSession.totalVolume, unit)}
          valueColor={color}
        />
        <StatRow
          compact={compact}
          label="Duration"
          value={formatSplitDuration(completedSession.durationSeconds)}
        />
        <StatRow
          compact={compact}
          label="PRs hit"
          value={
            completedSession.prCount > 0
              ? formatPrCount(completedSession.prCount)
              : '—'
          }
          valueColor={colors.gold}
        />
      </>
    );
  }

  if (status === 'today') {
    return (
      <>
        <StatRow compact={compact} label="Day" value="← Now" />
        <StatRow
          compact={compact}
          label="Last session"
          value={
            lastSession
              ? formatSplitVolume(lastSession.totalVolume, unit)
              : '—'
          }
          valueColor={color}
        />
        <StatRow
          compact={compact}
          label="Exercises"
          value={lastSession ? String(lastSession.exerciseCount || exerciseCount || '—') : '—'}
        />
        <StatRow compact={compact} label="Target" value="Beat last week" valueColor={LIME} />
      </>
    );
  }

  if (status === 'template') {
    return (
      <>
        <StatRow compact={compact} label="Exercises" value={String(exerciseCount ?? '—')} />
        <StatRow compact={compact} label="Last used" value={lastUsedLabel ?? 'Never'} />
        <StatRow
          compact={compact}
          label="Last session"
          value={
            lastSession
              ? formatSplitVolume(lastSession.totalVolume, unit)
              : 'No prior session'
          }
          valueColor={color}
        />
        <StatRow compact={compact} label="Target" value="Ready to start" valueColor={LIME} />
      </>
    );
  }

  return (
    <>
      <StatRow
        compact={compact}
        label="Last session"
        value={
          lastSession
            ? formatSplitVolume(lastSession.totalVolume, unit)
            : 'No prior session'
        }
        valueColor={color}
      />
      <StatRow
        compact={compact}
        label="Exercises"
        value={lastSession ? String(lastSession.exerciseCount || '—') : '—'}
      />
      <StatRow compact={compact} label="Target" value="Scheduled this week" />
    </>
  );
}

export interface DashboardWorkoutCardProps {
  model: DashboardWorkoutCardModel;
  unit: 'kg' | 'lb';
  onPress: () => void;
  compact?: boolean;
  footer?: ReactNode;
}

export function DashboardWorkoutCard({
  model,
  unit,
  onPress,
  compact = false,
  footer,
}: DashboardWorkoutCardProps) {
  const { pressed, handlers } = useDashboardTilePress(onPress);
  const padding = compact ? 16 : 20;
  const titleSize = compact ? 17 : 20;
  const gradientHeight = compact ? 96 : 120;

  return (
    <Pressable
      accessibilityRole="button"
      className={dashboardTileWebClassName('week-split-card')}
      {...handlers}
      style={{
        alignSelf: 'stretch',
        borderRadius: DASHBOARD_WORKOUT_CARD_RADIUS,
        borderWidth: 1,
        cursor: Platform.OS === 'web' ? ('pointer' as const) : undefined,
        flex: 1,
        overflow: Platform.OS === 'web' ? ('visible' as const) : undefined,
        ...dashboardPressStyle(pressed),
      }}
    >
      <View
        className={Platform.OS === 'web' ? 'week-split-card-inner' : undefined}
        style={{
          backgroundColor: CARD_BG,
          borderRadius: DASHBOARD_WORKOUT_CARD_RADIUS - 2,
          flex: 1,
          margin: 1,
          overflow: 'hidden',
        }}
      >
        <View style={{ height: gradientHeight, position: 'relative' }}>
          <LinearGradient
            colors={[hexToRgba(model.color, 0.1), 'transparent']}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={{
              borderTopLeftRadius: DASHBOARD_WORKOUT_CARD_RADIUS - 2,
              borderTopRightRadius: DASHBOARD_WORKOUT_CARD_RADIUS - 2,
              bottom: 0,
              left: 0,
              position: 'absolute',
              right: 0,
              top: 0,
            }}
          />

          <View
            style={{
              flex: 1,
              gap: compact ? 6 : 8,
              justifyContent: 'center',
              paddingHorizontal: padding,
            }}
          >
            <View style={{ gap: compact ? 2 : 4 }}>
              <Text
                numberOfLines={2}
                style={{
                  color: model.color,
                  fontFamily: fonts.brand,
                  fontSize: titleSize,
                  fontWeight: '700',
                }}
              >
                {model.title}
              </Text>
              <Text
                numberOfLines={2}
                style={{
                  color: MUTED,
                  fontFamily: fonts.body,
                  fontSize: compact ? 10 : 11,
                }}
              >
                {model.subtitle}
              </Text>
            </View>

            <StatusBadge
              color={model.color}
              compact={compact}
              splitId={model.splitId}
              status={model.status}
            />
          </View>
        </View>

        <View
          style={{
            gap: compact ? 8 : 10,
            paddingBottom: padding,
            paddingHorizontal: padding,
            paddingTop: compact ? 8 : 10,
          }}
        >
          <View style={{ backgroundColor: BORDER, height: 1 }} />

          <View className="gap-2">
            <CardStats compact={compact} model={model} unit={unit} />
          </View>

          {footer ? <View>{footer}</View> : null}
        </View>
      </View>
    </Pressable>
  );
}
