import { format, parseISO } from 'date-fns';
import { ScrollView, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { formatElapsedDuration } from '@/hooks/useWorkoutTimer';
import type { WorkoutWithDetails } from '@/lib/supabase';
import { formatLoggedSetLine } from '@/lib/workout/formatSessionVolume';
import { kgToDisplay, volumeLabel } from '@/lib/units';

interface WorkoutSessionDetailProps {
  workout: WorkoutWithDetails;
  unit: 'kg' | 'lb';
  title?: string;
  embedded?: boolean;
}

export function WorkoutSessionDetail({
  workout,
  unit,
  title = 'Session Detail',
  embedded = false,
}: WorkoutSessionDetailProps) {
  const exerciseCount = workout.workout_exercises.length;

  const content = (
    <>
      {!embedded ? (
        <>
          <AppText className="text-3xl" variant="display">
            {title}
          </AppText>
          <AppText variant="muted">{workout.name}</AppText>
        </>
      ) : (
        <View className="gap-1">
          <AppText variant="display">{workout.name}</AppText>
          <AppText variant="muted">
            {format(parseISO(workout.started_at), 'EEEE · MMM d, yyyy')}
          </AppText>
        </View>
      )}

      <Card className="gap-4">
        <View className="flex-row flex-wrap gap-6">
          <Stat label="Date" value={format(parseISO(workout.started_at), 'MMM d, yyyy')} />
          <Stat
            label="Duration"
            value={
              workout.duration_seconds != null
                ? formatElapsedDuration(workout.duration_seconds)
                : '—'
            }
          />
          <Stat
            label="Volume"
            value={`${kgToDisplay(workout.total_volume, unit)} ${volumeLabel(unit)}`}
          />
          <Stat label="Exercises" value={String(exerciseCount)} />
        </View>
      </Card>

      <View className="gap-2">
        <AppText variant="display">Logged</AppText>
        {workout.workout_exercises.map((we) => {
          const completedSets = (we.sets ?? []).filter((s) => s.completed_at);
          if (completedSets.length === 0) return null;

          return (
            <Card key={we.id}>
              <AppText variant="body">{we.exercise.name}</AppText>
              {completedSets.map((set) => (
                <AppText className="mt-1" key={set.id} variant="mono">
                  {formatLoggedSetLine(
                    set.set_number,
                    set.reps,
                    set.weight,
                    unit,
                    { isPr: set.is_pr },
                  )}
                </AppText>
              ))}
            </Card>
          );
        })}
      </View>

      {workout.notes ? (
        <Card>
          <AppText variant="display">Notes</AppText>
          <AppText className="mt-2" variant="body">
            {workout.notes}
          </AppText>
        </Card>
      ) : null}
    </>
  );

  if (embedded) {
    return <View className="gap-4">{content}</View>;
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="gap-4 p-5 pb-10"
      showsVerticalScrollIndicator={false}
    >
      {content}
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <AppText variant="muted">{label}</AppText>
      <AppText variant="mono">{value}</AppText>
    </View>
  );
}
