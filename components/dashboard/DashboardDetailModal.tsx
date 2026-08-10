import { type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { X } from 'lucide-react-native';

import { colors, fonts } from '@/constants/theme';
import { wrapDashboardModalClose } from '@/lib/dashboard/cardStyles';

const CARD_BG = '#0d0d1b';
const CARD_BORDER = 'rgba(255,255,255,0.06)';
const MUTED = 'rgba(240,237,232,0.5)';

interface DashboardDetailModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  eyebrowColor?: string;
  subtitle?: string;
  children: ReactNode;
}

export function DashboardDetailModal({
  visible,
  onClose,
  title,
  eyebrow,
  eyebrowColor = colors.accent,
  subtitle,
  children,
}: DashboardDetailModalProps) {
  const handleClose = wrapDashboardModalClose(onClose);

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
            maxHeight: '88%',
            maxWidth: 480,
            padding: 18,
            width: '100%',
          }}
        >
          <View className="mb-4 flex-row items-start justify-between gap-3">
            <View className="flex-1 gap-1">
              {eyebrow ? (
                <Text
                  style={{
                    color: eyebrowColor,
                    fontFamily: fonts.jetbrainsMono,
                    fontSize: 9,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                  }}
                >
                  {eyebrow}
                </Text>
              ) : null}
              <Text
                style={{
                  color: colors.text,
                  fontFamily: fonts.brand,
                  fontSize: 20,
                  fontWeight: '700',
                }}
              >
                {title}
              </Text>
              {subtitle ? (
                <Text style={{ color: MUTED, fontFamily: fonts.body, fontSize: 11 }}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <Pressable accessibilityLabel="Close" onPress={handleClose}>
              <X color={MUTED} size={18} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ gap: 12, paddingBottom: 4 }}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function DashboardDetailRow({
  label,
  value,
  valueColor = colors.text,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Text style={{ color: MUTED, fontFamily: fonts.body, fontSize: 12 }}>{label}</Text>
      <Text
        style={{
          color: valueColor,
          fontFamily: fonts.jetbrainsMono,
          fontSize: 12,
          textAlign: 'right',
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export function DashboardDetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View
      style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderColor: CARD_BORDER,
        borderRadius: 12,
        borderWidth: 1,
        gap: 10,
        padding: 14,
      }}
    >
      <Text
        style={{
          color: colors.text,
          fontFamily: fonts.bodySemiBold,
          fontSize: 13,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}
