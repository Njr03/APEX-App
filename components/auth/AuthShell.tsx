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
  children: React.ReactNode;
}

function ApexLoginHeader({ subtitle }: { subtitle: string }) {
  const [logoWidth, setLogoWidth] = useState(0);

  return (
    <View className="items-center">
      <View
        onLayout={(event) => {
          setLogoWidth(event.nativeEvent.layout.width);
        }}
      >
        <ApexLogo height={120} />
      </View>
      <View
        className="mt-0.5 flex-row justify-between"
        style={{ width: logoWidth > 0 ? logoWidth : undefined }}
      >
        {subtitle.split('').map((letter, index) => (
          <AppText
            className="text-accent"
            key={`${letter}-${index}`}
            variant="muted"
          >
            {letter}
          </AppText>
        ))}
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
  children,
}: AuthShellProps) {
  const isApexLogin = title === 'APEX';
  const alignClass = subtitleAlign === 'center' ? 'text-center' : 'text-left';
  const useStretchedSubtitle = isApexLogin && subtitleStretch;

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="grow justify-center px-6 py-10"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-10">
            {useStretchedSubtitle ? (
              <ApexLoginHeader subtitle={subtitle} />
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
