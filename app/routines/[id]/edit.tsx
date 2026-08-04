import { useLocalSearchParams } from 'expo-router';

import { RoutineBuilder } from '@/components/routines/RoutineBuilder';

export default function EditRoutineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <RoutineBuilder routineId={id} />;
}
