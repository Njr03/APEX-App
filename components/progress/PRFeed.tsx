import { format, parseISO } from 'date-fns';
import { Trophy } from 'lucide-react-native';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import { formatRecordValue } from '@/lib/personalRecords';
import type { PersonalRecordWithExercise } from '@/lib/supabase';

interface PRFeedProps {
  records: PersonalRecordWithExercise[];
  unit: 'kg' | 'lb';
}

export function PRFeed({ records, unit }: PRFeedProps) {
  if (records.length === 0) {
    return (
      <Card>
        <AppText variant="muted">No personal records logged yet.</AppText>
      </Card>
    );
  }

  return (
    <View className="gap-2">
      {records.map((record) => (
        <Card className="flex-row items-start gap-3" key={record.id}>
          <Trophy color={colors.gold} size={18} />
          <View className="flex-1">
            <AppText variant="body">{record.exercise.name}</AppText>
            <AppText className="mt-1 text-gold" variant="mono">
              {formatRecordValue(record.record_type, record.value, unit)}
            </AppText>
            <AppText className="mt-1 capitalize" variant="muted">
              {record.record_type.replace('_', ' ')} ·{' '}
              {format(parseISO(record.achieved_at), 'MMM d, yyyy')}
            </AppText>
          </View>
        </Card>
      ))}
    </View>
  );
}
