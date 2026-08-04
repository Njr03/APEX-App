import { useEffect } from 'react';
import { router } from 'expo-router';
import { Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Plus, X } from 'lucide-react-native';

import { useDashboardCardOptions } from '@/hooks/useDashboardCardOptions';
import { useRoutineSummaries } from '@/hooks/queries';
import { colors, fonts } from '@/constants/theme';
import type { DashboardCardRef } from '@/lib/dashboard/dashboardCards';
import { dashboardCardKey } from '@/lib/dashboard/dashboardCards';
import { useDashboardCardsStore } from '@/stores/dashboardCardsStore';

const CARD_BG = '#0d0d1b';
const CARD_BORDER = 'rgba(255,255,255,0.06)';
const MUTED = 'rgba(240,237,232,0.5)';

interface DashboardAddCardModalProps {
  visible: boolean;
  onClose: () => void;
  cardsForAvailability?: DashboardCardRef[];
  onAdded?: () => void;
}

function stopPressPropagation(event: { stopPropagation?: () => void }) {
  event.stopPropagation?.();
}

export function DashboardAddCardModal({
  visible,
  onClose,
  cardsForAvailability,
  onAdded,
}: DashboardAddCardModalProps) {
  const cards = useDashboardCardsStore((state) => state.cards);
  const addCard = useDashboardCardsStore((state) => state.addCard);
  const { data: routines, refetch: refetchSavedWorkouts } = useRoutineSummaries();
  const availability = cardsForAvailability ?? cards;
  const options = useDashboardCardOptions(availability);

  useEffect(() => {
    if (visible) {
      void refetchSavedWorkouts();
    }
  }, [refetchSavedWorkouts, visible]);

  const handlePickOption = async (option: DashboardCardRef) => {
    await addCard(option);
    onAdded?.();
    onClose();
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <Pressable
        className="flex-1 justify-end"
        style={{ backgroundColor: 'rgba(0,0,0,0.72)' }}
        onPress={onClose}
      >
        <Pressable
          onPress={stopPressPropagation}
          style={{
            backgroundColor: CARD_BG,
            borderColor: CARD_BORDER,
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            borderWidth: 1,
            maxHeight: '85%',
            padding: 18,
          }}
        >
          <View className="flex-row items-center justify-between" style={{ marginBottom: 14 }}>
            <View style={{ gap: 4 }}>
              <Text
                style={{
                  color: colors.text,
                  fontFamily: fonts.brand,
                  fontSize: 16,
                  fontWeight: '700',
                }}
              >
                Add Workout Card
              </Text>
              <Text style={{ color: MUTED, fontFamily: fonts.body, fontSize: 11 }}>
                Pick a saved workout for your dashboard.
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Close"
              accessibilityRole="button"
              onPress={(event) => {
                stopPressPropagation(event);
                onClose();
              }}
            >
              <X color={MUTED} size={18} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 24 }}>
            {options.length === 0 ? (
              <Text style={{ color: MUTED, fontFamily: fonts.body, fontSize: 12 }}>
                {(routines?.length ?? 0) === 0
                  ? 'No saved workouts yet. Create one below.'
                  : 'All saved workouts are already on your dashboard.'}
              </Text>
            ) : (
              options.map((option) => (
                <Pressable
                  key={dashboardCardKey(option.ref)}
                  accessibilityRole="button"
                  onPress={(event) => {
                    stopPressPropagation(event);
                    void handlePickOption(option.ref);
                  }}
                  style={{
                    alignItems: 'center',
                    backgroundColor: '#141427',
                    borderColor: CARD_BORDER,
                    borderRadius: 10,
                    borderWidth: 1,
                    cursor: Platform.OS === 'web' ? ('pointer' as const) : undefined,
                    flexDirection: 'row',
                    gap: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                  }}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text
                      style={{
                        color: colors.text,
                        fontFamily: fonts.bodySemiBold,
                        fontSize: 13,
                      }}
                    >
                      {option.label}
                    </Text>
                    <Text
                      style={{
                        color: MUTED,
                        fontFamily: fonts.jetbrainsMono,
                        fontSize: 10,
                      }}
                    >
                      {option.subtitle}
                    </Text>
                  </View>
                  <Plus color={colors.accent} size={16} />
                </Pressable>
              ))
            )}

            {options.length === 0 ? (
              <Pressable
                accessibilityRole="button"
                onPress={(event) => {
                  stopPressPropagation(event);
                  onClose();
                  router.push('/routines/new');
                }}
                style={{
                  alignItems: 'center',
                  backgroundColor: 'rgba(200,255,90,0.08)',
                  borderColor: 'rgba(200,255,90,0.25)',
                  borderRadius: 10,
                  borderWidth: 1,
                  cursor: Platform.OS === 'web' ? ('pointer' as const) : undefined,
                  flexDirection: 'row',
                  gap: 10,
                  justifyContent: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 14,
                }}
              >
                <Plus color={colors.accent} size={16} />
                <Text
                  style={{
                    color: colors.accent,
                    fontFamily: fonts.brand,
                    fontSize: 13,
                    fontWeight: '700',
                  }}
                >
                  Create new workout
                </Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
