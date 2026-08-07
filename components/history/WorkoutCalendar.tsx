import { addMonths, format, isToday, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import { buildMonthCalendarDays } from '@/lib/progress/stats';

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const COMPLETED_COLOR = colors.accent;

interface CalendarDayCellProps {
  date: Date;
  dayCellClass: string;
  dayPressableClass: string;
  dotSize: number;
  embedded: boolean;
  hasWorkout: boolean;
  inMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
  persistSelectedDayStyle?: boolean;
  onSelectDate: (date: Date) => void;
}

function CalendarDayCell({
  date,
  dayCellClass,
  dayPressableClass,
  dotSize,
  embedded,
  hasWorkout,
  inMonth,
  isSelected,
  isToday,
  persistSelectedDayStyle = true,
  onSelectDate,
}: CalendarDayCellProps) {
  const [hovered, setHovered] = useState(false);
  const isCompletedDay = hasWorkout && inMonth;
  const showTodayRing = isToday && inMonth;
  const highlightNumber =
    (persistSelectedDayStyle && isSelected) ||
    (hovered && isCompletedDay) ||
    showTodayRing;
  const showSelectedBackground = persistSelectedDayStyle && isSelected;

  return (
    <Pressable
      accessibilityLabel={format(date, 'MMMM d, yyyy')}
      accessibilityRole="button"
      className={dayPressableClass}
      onHoverIn={() => {
        if (isCompletedDay) setHovered(true);
      }}
      onHoverOut={() => setHovered(false)}
      onPress={() => onSelectDate(date)}
      style={Platform.OS === 'web' && isCompletedDay ? { cursor: 'pointer' } : undefined}
    >
      <View
        className={`${dayCellClass} items-center justify-center rounded-full`}
        style={{
          backgroundColor: showSelectedBackground
            ? 'rgba(200,255,90,0.12)'
            : showTodayRing
              ? 'rgba(200,255,90,0.08)'
              : 'transparent',
          borderColor: showTodayRing ? COMPLETED_COLOR : 'transparent',
          borderWidth: showTodayRing ? 1.5 : 0,
        }}
      >
        <AppText
          style={{
            color: highlightNumber
              ? COMPLETED_COLOR
              : inMonth
                ? colors.text
                : 'rgba(240,237,232,0.25)',
            fontSize: embedded ? 10 : undefined,
          }}
          variant="mono"
        >
          {format(date, 'd')}
        </AppText>
        <View className="mt-0.5 flex-row items-center justify-center gap-0.5">
          {hasWorkout && inMonth ? (
            <View
              style={{
                backgroundColor: COMPLETED_COLOR,
                borderRadius: 999,
                height: dotSize,
                width: dotSize,
              }}
            />
          ) : (
            <View style={{ height: dotSize, width: dotSize }} />
          )}
        </View>
      </View>
    </Pressable>
  );
}

interface WorkoutCalendarProps {
  month: Date;
  onMonthChange: (month: Date) => void;
  trainingDays: Set<string>;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  embedded?: boolean;
  persistSelectedDayStyle?: boolean;
}

export function WorkoutCalendar({
  month,
  onMonthChange,
  trainingDays,
  selectedDate,
  onSelectDate,
  embedded = false,
  persistSelectedDayStyle = true,
}: WorkoutCalendarProps) {
  const days = buildMonthCalendarDays(month, trainingDays);
  const chevronSize = embedded ? 16 : 20;
  const dayCellClass = embedded ? 'h-7 w-7' : 'h-9 w-9';
  const dayPressableClass = embedded
    ? 'w-[14.28%] items-center py-1 active:opacity-70'
    : 'w-[14.28%] items-center py-2 active:opacity-70';
  const dotSize = embedded ? 5 : 6;

  const content = (
    <>
      <View className="flex-row items-center justify-between">
        <Pressable
          accessibilityLabel="Previous month"
          accessibilityRole="button"
          className={embedded ? 'rounded-lg p-1 active:opacity-70' : 'rounded-lg p-2 active:opacity-70'}
          onPress={() => onMonthChange(subMonths(month, 1))}
        >
          <ChevronLeft color={colors.text} size={chevronSize} />
        </Pressable>
        <AppText
          className={embedded ? 'text-xs' : undefined}
          variant={embedded ? 'body' : 'display'}
        >
          {format(month, embedded ? 'MMM yyyy' : 'MMMM yyyy')}
        </AppText>
        <Pressable
          accessibilityLabel="Next month"
          accessibilityRole="button"
          className={embedded ? 'rounded-lg p-1 active:opacity-70' : 'rounded-lg p-2 active:opacity-70'}
          onPress={() => onMonthChange(addMonths(month, 1))}
        >
          <ChevronRight color={colors.text} size={chevronSize} />
        </Pressable>
      </View>

      <View className="flex-row">
        {WEEKDAY_LABELS.map((label, index) => (
          <View className="flex-1 items-center" key={`${label}-${index}`}>
            <AppText className="text-[10px]" variant="muted">
              {label}
            </AppText>
          </View>
        ))}
      </View>

      <View className="flex-row flex-wrap">
        {days.map(({ date, inMonth, hasWorkout }) => {
          const dateKey = format(date, 'yyyy-MM-dd');
          const isSelected =
            selectedDate != null &&
            format(selectedDate, 'yyyy-MM-dd') === dateKey;

          return (
            <CalendarDayCell
              key={date.toISOString()}
              date={date}
              dayCellClass={dayCellClass}
              dayPressableClass={dayPressableClass}
              dotSize={dotSize}
              embedded={embedded}
              hasWorkout={hasWorkout}
              inMonth={inMonth}
              isSelected={isSelected}
              isToday={isToday(date)}
              onSelectDate={onSelectDate}
              persistSelectedDayStyle={persistSelectedDayStyle}
            />
          );
        })}
      </View>
    </>
  );

  if (embedded) {
    return <View className="gap-2">{content}</View>;
  }

  return <Card className="gap-3">{content}</Card>;
}
