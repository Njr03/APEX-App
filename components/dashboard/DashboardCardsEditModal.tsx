import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Plus, Trash2, X } from 'lucide-react-native';

import { useDashboardCardOptions } from '@/hooks/useDashboardCardOptions';
import { useRoutineSummaries } from '@/hooks/queries';
import { colors, fonts } from '@/constants/theme';
import {
  dashboardCardKey,
  type DashboardCardRef,
} from '@/lib/dashboard/dashboardCards';
import { SPLIT_DEFINITIONS } from '@/lib/training/splits';
import {
  useDashboardCardsStore,
} from '@/stores/dashboardCardsStore';

const CARD_BG = '#0d0d1b';
const CARD_BORDER = 'rgba(255,255,255,0.06)';
const MUTED = 'rgba(240,237,232,0.5)';

interface DashboardCardsEditModalProps {
  visible: boolean;
  onClose: () => void;
}

function resolveCardTitle(
  card: DashboardCardRef,
  routineNames: Map<string, string>,
): string {
  if (card.kind === 'split') {
    return SPLIT_DEFINITIONS[card.split].name;
  }

  return routineNames.get(card.routineId) ?? 'Saved workout';
}

function stopPressPropagation(event: { stopPropagation?: () => void }) {
  event.stopPropagation?.();
}

export function DashboardCardsEditModal({
  visible,
  onClose,
}: DashboardCardsEditModalProps) {
  const cards = useDashboardCardsStore((state) => state.cards);
  const removeCard = useDashboardCardsStore((state) => state.removeCard);
  const replaceCard = useDashboardCardsStore((state) => state.replaceCard);
  const addCard = useDashboardCardsStore((state) => state.addCard);
  const { data: routines, refetch: refetchSavedWorkouts } = useRoutineSummaries();
  const [replacingKey, setReplacingKey] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setReplacingKey(null);
      return;
    }

    void refetchSavedWorkouts();
  }, [refetchSavedWorkouts, visible]);

  const routineNames = useMemo(
    () => new Map((routines ?? []).map((routine) => [routine.id, routine.name])),
    [routines],
  );

  const cardsForAvailability = useMemo(() => {
    if (!replacingKey) return cards;
    return cards.filter((card) => dashboardCardKey(card) !== replacingKey);
  }, [cards, replacingKey]);

  const availableOptions = useDashboardCardOptions(cardsForAvailability);

  const handlePickOption = async (option: DashboardCardRef) => {
    if (replacingKey) {
      await replaceCard(replacingKey, option);
      setReplacingKey(null);
      return;
    }

    await addCard(option);
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
                Edit Dashboard Cards
              </Text>
              <Text style={{ color: MUTED, fontFamily: fonts.body, fontSize: 11 }}>
                Remove, replace, or add workout cards from your saved types.
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

          <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
            <View style={{ gap: 8 }}>
              <Text
                style={{
                  color: MUTED,
                  fontFamily: fonts.jetbrainsMono,
                  fontSize: 9,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                }}
              >
                Current cards
              </Text>

              {cards.length === 0 ? (
                <Text style={{ color: MUTED, fontFamily: fonts.body, fontSize: 12 }}>
                  No cards on your dashboard. Add one below or use the plus slot on the
                  dashboard.
                </Text>
              ) : null}

              {cards.map((card) => {
                const key = dashboardCardKey(card);
                const isReplacing = replacingKey === key;

                return (
                  <View
                    key={key}
                    style={{
                      alignItems: 'center',
                      backgroundColor: '#141427',
                      borderColor: isReplacing ? colors.accent : CARD_BORDER,
                      borderRadius: 10,
                      borderWidth: 1,
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
                        {resolveCardTitle(card, routineNames)}
                      </Text>
                      <Text
                        style={{
                          color: MUTED,
                          fontFamily: fonts.jetbrainsMono,
                          fontSize: 10,
                        }}
                      >
                        {card.kind === 'split'
                          ? SPLIT_DEFINITIONS[card.split].eyebrow
                          : 'Saved workout template'}
                      </Text>
                    </View>

                    <Pressable
                      accessibilityLabel="Replace card"
                      accessibilityRole="button"
                      onPress={(event) => {
                        stopPressPropagation(event);
                        setReplacingKey((current) => (current === key ? null : key));
                      }}
                      style={{
                        borderColor: isReplacing ? colors.accent : CARD_BORDER,
                        borderRadius: 8,
                        borderWidth: 1,
                        cursor: Platform.OS === 'web' ? ('pointer' as const) : undefined,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: isReplacing ? colors.accent : colors.text,
                          fontFamily: fonts.body,
                          fontSize: 10,
                        }}
                      >
                        Replace
                      </Text>
                    </Pressable>

                    <Pressable
                      accessibilityLabel="Remove card"
                      accessibilityRole="button"
                      onPress={(event) => {
                        stopPressPropagation(event);
                        void removeCard(key);
                      }}
                      style={{
                        cursor: Platform.OS === 'web' ? ('pointer' as const) : undefined,
                        padding: 4,
                      }}
                    >
                      <Trash2 color={colors.accent3} size={16} />
                    </Pressable>
                  </View>
                );
              })}
            </View>

            <View style={{ gap: 8 }}>
              <Text
                style={{
                  color: MUTED,
                  fontFamily: fonts.jetbrainsMono,
                  fontSize: 9,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                }}
              >
                {replacingKey ? 'Pick a replacement' : 'Add a card'}
              </Text>

              {availableOptions.length === 0 ? (
                <Text style={{ color: MUTED, fontFamily: fonts.body, fontSize: 12 }}>
                  {replacingKey
                    ? 'No other saved workouts available to swap in.'
                    : (routines?.length ?? 0) === 0
                      ? 'No saved workouts yet. Create one below.'
                      : 'All saved workouts are already on your dashboard.'}
                </Text>
              ) : (
                availableOptions.map((option) => (
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

              {!replacingKey && availableOptions.length === 0 ? (
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
            </View>

            {replacingKey ? (
              <Pressable
                accessibilityRole="button"
                onPress={(event) => {
                  stopPressPropagation(event);
                  setReplacingKey(null);
                }}
              >
                <Text
                  style={{
                    color: MUTED,
                    fontFamily: fonts.body,
                    fontSize: 11,
                    textAlign: 'center',
                  }}
                >
                  Cancel replace
                </Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
