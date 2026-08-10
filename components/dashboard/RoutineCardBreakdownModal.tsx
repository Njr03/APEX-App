import { ActivityIndicator, Modal, Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { X } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/AppText';
import { useRoutine } from '@/hooks/queries';
import type { RoutineSummary } from '@/hooks/queries/useRoutineSummaries';
import { colors, fonts } from '@/constants/theme';
import { wrapDashboardModalClose } from '@/lib/dashboard/cardStyles';
import { kgToDisplay } from '@/lib/units';

const CARD_BG = '#0d0d1b';
const CARD_BORDER = 'rgba(255,255,255,0.06)';
const MUTED = 'rgba(240,237,232,0.5)';

interface RoutineCardBreakdownModalProps {
  routine: RoutineSummary | null;
  unit: 'kg' | 'lb';
  visible: boolean;
  onClose: () => void;
  onStartWorkout?: () => void;
  onEditWorkout?: () => void;
  isStarting?: boolean;
  startError?: string | null;
  blockedMessage?: string | null;
}

export function RoutineCardBreakdownModal({
  routine,
  unit,
  visible,
  onClose,
  onStartWorkout,
  onEditWorkout,
  isStarting = false,
  startError = null,
  blockedMessage = null,
}: RoutineCardBreakdownModalProps) {
  const handleClose = wrapDashboardModalClose(onClose);
  const { data: routineDetail, isLoading: isLoadingDetail } = useRoutine(routine?.id);

  if (!routine) return null;

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={handleClose}>
      <Pressable
        className="flex-1 items-center justify-center px-5"
        style={{ backgroundColor: 'rgba(0,0,0,0.72)' }}
        onPress={handleClose}
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={{
            backgroundColor: CARD_BG,
            borderColor: CARD_BORDER,
            borderRadius: 16,
            borderWidth: 1,
            maxHeight: '80%',
            maxWidth: 420,
            padding: 18,
            width: '100%',
          }}
        >
          <View className="flex-row items-start justify-between" style={{ gap: 12 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text
                style={{
                  color: colors.accent,
                  fontFamily: fonts.jetbrainsMono,
                  fontSize: 9,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                }}
              >
                Saved Workout
              </Text>
              <Text
                style={{
                  color: colors.text,
                  fontFamily: fonts.brand,
                  fontSize: 20,
                  fontWeight: '700',
                }}
              >
                {routine.name}
              </Text>
              <Text style={{ color: MUTED, fontFamily: fonts.body, fontSize: 11 }}>
                {routine.target_muscles}
              </Text>
              {routine.description ? (
                <Text style={{ color: MUTED, fontFamily: fonts.body, fontSize: 11 }}>
                  {routine.description}
                </Text>
              ) : null}
            </View>
            <Pressable accessibilityLabel="Close" onPress={handleClose}>
              <X color={MUTED} size={18} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ gap: 10, paddingTop: 16 }}
            showsVerticalScrollIndicator={false}
          >
            <Text
              style={{
                color: MUTED,
                fontFamily: fonts.jetbrainsMono,
                fontSize: 9,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
              }}
            >
              Workout breakdown
            </Text>

            {isLoadingDetail ? (
              <ActivityIndicator color={colors.accent} />
            ) : null}

            {!isLoadingDetail && routineDetail?.routine_exercises?.length
              ? routineDetail.routine_exercises.map((entry) => (
                  <View
                    key={entry.id}
                    className="flex-row items-center justify-between"
                    style={{ gap: 10 }}
                  >
                    <Text
                      className="flex-1"
                      numberOfLines={1}
                      style={{
                        color: colors.text,
                        fontFamily: fonts.bodyMedium,
                        fontSize: 12,
                      }}
                    >
                      {entry.exercise.name}
                    </Text>
                    <Text
                      style={{
                        color: MUTED,
                        fontFamily: fonts.jetbrainsMono,
                        fontSize: 10,
                      }}
                    >
                      {entry.target_sets ?? 3}×{entry.target_reps ?? '—'}
                      {entry.target_weight
                        ? ` · ${kgToDisplay(entry.target_weight, unit)}${unit}`
                        : ''}
                    </Text>
                  </View>
                ))
              : null}

            {!isLoadingDetail && !routineDetail?.routine_exercises?.length ? (
              <Text style={{ color: MUTED, fontFamily: fonts.body, fontSize: 12 }}>
                {routine.exercise_count} exercises in this saved workout.
              </Text>
            ) : null}
          </ScrollView>

          {onStartWorkout || onEditWorkout || blockedMessage ? (
            <View style={{ gap: 8, paddingTop: 16 }}>
              {onStartWorkout ? (
                <Button
                  disabled={isStarting || isLoadingDetail}
                  label="Start workout"
                  loading={isStarting}
                  onPress={onStartWorkout}
                  variant="primary"
                />
              ) : null}
              {onEditWorkout ? (
                <Button
                  disabled={isStarting || isLoadingDetail}
                  label="Edit"
                  onPress={onEditWorkout}
                  variant="secondary"
                />
              ) : null}
              {startError ? (
                <AppText className="text-accent3" variant="body">
                  {startError}
                </AppText>
              ) : null}
              {!onStartWorkout && blockedMessage ? (
                <AppText variant="muted">{blockedMessage}</AppText>
              ) : null}
            </View>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
