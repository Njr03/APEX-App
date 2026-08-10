import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { ApexLogo } from '@/components/branding/ApexLogo';
import { Screen } from '@/components/ui/Screen';
import { cn } from '@/lib/cn';

interface AuthShellProps {
  title: string;
  subtitle: string;
  subtitleAlign?: 'left' | 'center';
  /** `accent` keeps subtitle body size; `accent-display` matches the title size. */
  subtitleTone?: 'muted' | 'accent' | 'accent-display';
  /** Stretch subtitle letters to span the title width (login hero). */
  subtitleStretch?: boolean;
  backgroundColor?: string;
  children: React.ReactNode;
}

function StretchedLetterRow({
  text,
  tone,
  width,
}: {
  text: string;
  tone: 'title' | 'subtitle';
  width: number;
}) {
  return (
    <View
      className="flex-row justify-between"
      style={{ width: width > 0 ? width : undefined }}
    >
      {text.split('').map((letter, index) => (
        <AppText
          className={cn(
            tone === 'subtitle' && 'text-xs text-accent',
            tone === 'title' && 'text-3xl',
          )}
          key={`${text}-${index}`}
          variant={tone === 'title' ? 'display' : 'muted'}
        >
          {letter}
        </AppText>
      ))}
    </View>
  );
}

function ApexLoginHeader({ title, subtitle }: { title: string; subtitle: string }) {
  const [titleWidth, setTitleWidth] = useState(0);

  return (
    <View className="items-center">
      <ApexLogo height={130} />

      <View className="mt-2 items-center" style={{ gap: 3 }}>
        <AppText
          className="absolute text-3xl opacity-0"
          onLayout={(event) => {
            setTitleWidth(event.nativeEvent.layout.width);
          }}
          variant="display"
        >
          {title}
        </AppText>

        <StretchedLetterRow text={title} tone="title" width={titleWidth} />
        <StretchedLetterRow text={subtitle} tone="subtitle" width={titleWidth} />
      </View>
    </View>
  );
}

export function AuthShell({
  title,
  subtitle,
  subtitleAlign = 'center',
  subtitleTone = 'muted',
  subtitleStretch = false,
  backgroundColor,
  children,
}: AuthShellProps) {
  const isApexLogin = title === 'APEX';
  const alignClass = subtitleAlign === 'center' ? 'text-center' : 'text-left';
  const useStretchedSubtitle = isApexLogin && subtitleStretch;
  const scrollContentClassName = useStretchedSubtitle
    ? 'grow justify-center px-10 py-8 pb-24'
    : 'grow justify-center px-6 py-10';
  const headerClassName = useStretchedSubtitle ? 'mb-6' : 'mb-10';

  return (
    <Screen backgroundColor={backgroundColor}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName={scrollContentClassName}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className={headerClassName}>
            {useStretchedSubtitle ? (
              <ApexLoginHeader subtitle={subtitle} title={title} />
            ) : isApexLogin ? (
              <View className="items-center">
                <ApexLogo height={120} />
              </View>
            ) : (
              <AppText className="text-3xl" variant="display">
                {title}
              </AppText>
            )}

            {!useStretchedSubtitle && subtitleTone === 'accent-display' ? (
              <AppText
                className={cn('mt-2 text-4xl text-accent', alignClass)}
                variant="display"
              >
                {subtitle}
              </AppText>
            ) : null}

            {!useStretchedSubtitle && subtitleTone !== 'accent-display' ? (
              <AppText
                className={cn(
                  'mt-2',
                  alignClass,
                  subtitleTone === 'accent' && 'text-accent',
                )}
                variant="muted"
              >
                {subtitle}
              </AppText>
            ) : null}
          </View>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
