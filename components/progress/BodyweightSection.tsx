import { format, parseISO } from 'date-fns';
import { useState } from 'react';
import { Dimensions, Modal, Pressable, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { X } from 'lucide-react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { NumericInput } from '@/components/ui/NumericInput';
import { useUpsertBodyMetric } from '@/hooks/queries';
import { colors } from '@/constants/theme';
import type { BodyMetric } from '@/lib/supabase';
import { displayToKg, kgToDisplay, volumeLabel } from '@/lib/units';
import { getSupabaseErrorMessage } from '@/lib/supabase/errors';

interface BodyweightSectionProps {
  metrics: BodyMetric[];
  unit: 'kg' | 'lb';
}

export function BodyweightSection({ metrics, unit }: BodyweightSectionProps) {
  const upsertMetric = useUpsertBodyMetric();
  const [modalVisible, setModalVisible] = useState(false);
  const [weightText, setWeightText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const sorted = [...metrics]
    .filter((m) => m.weight != null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-12);

  const chartWidth = Math.min(Dimensions.get('window').width - 72, 360);
  const chartData = sorted.map((metric, index) => ({
    value: metric.weight ?? 0,
    label:
      index === 0 || index === sorted.length - 1
        ? format(parseISO(metric.date), 'MMM d')
        : '',
  }));

  const handleSave = async () => {
    setError(null);
    const weightKg = displayToKg(weightText, unit);

    if (weightKg == null || weightKg <= 0) {
      setError('Enter a valid weight.');
      return;
    }

    try {
      await upsertMetric.mutateAsync({
        date: format(new Date(), 'yyyy-MM-dd'),
        weight: weightKg,
      });
      setWeightText('');
      setModalVisible(false);
    } catch (err) {
      setError(getSupabaseErrorMessage(err));
    }
  };

  return (
    <>
      <Card className="gap-3">
        <View className="flex-row items-center justify-between">
          <View>
            <AppText variant="display">Bodyweight</AppText>
            <AppText variant="muted">
              Track weight over time ({volumeLabel(unit)})
            </AppText>
          </View>
          <Button
            className="min-h-10 px-3"
            label="+ Log"
            onPress={() => setModalVisible(true)}
            variant="secondary"
          />
        </View>

        {sorted.length === 0 ? (
          <AppText variant="muted">No bodyweight entries yet.</AppText>
        ) : (
          <LineChart
            color={colors.accent4}
            curved
            data={chartData}
            dataPointsColor={colors.accent4}
            dataPointsRadius={3}
            height={150}
            initialSpacing={12}
            maxValue={Math.max(...chartData.map((d) => d.value), 1) * 1.1}
            noOfSections={4}
            spacing={Math.max(24, chartWidth / Math.max(chartData.length, 1))}
            thickness={2}
            width={chartWidth}
            xAxisColor={colors.border}
            yAxisColor={colors.border}
            yAxisTextStyle={{ color: colors.muted, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: colors.muted, fontSize: 9 }}
            rulesColor={colors.border}
            formatYLabel={(value) => kgToDisplay(Number(value), unit)}
          />
        )}
      </Card>

      <Modal animationType="slide" transparent visible={modalVisible}>
        <View className="flex-1 justify-end bg-black/60">
          <View className="rounded-t-2xl border border-border bg-bg px-5 pb-8 pt-4">
            <View className="mb-4 flex-row items-center justify-between">
              <AppText className="text-xl" variant="display">
                Log bodyweight
              </AppText>
              <Pressable onPress={() => setModalVisible(false)}>
                <X color={colors.text} size={22} />
              </Pressable>
            </View>

            <AppText variant="muted">
              Today · {format(new Date(), 'MMM d, yyyy')}
            </AppText>

            <View className="mt-4 gap-2">
              <AppText variant="body">Weight ({volumeLabel(unit)})</AppText>
              <NumericInput
                onChangeText={setWeightText}
                placeholder="0"
                value={weightText}
              />
            </View>

            {error ? (
              <AppText className="mt-3 text-accent3" variant="body">
                {error}
              </AppText>
            ) : null}

            <Button
              className="mt-5"
              label="Save"
              loading={upsertMetric.isPending}
              onPress={handleSave}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}
