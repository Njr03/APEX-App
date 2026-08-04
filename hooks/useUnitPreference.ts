import { useProfile } from '@/hooks/queries/useProfile';
import {
  resolveUnitPreference,
  type UnitPreference,
} from '@/lib/profile/unitPreference';

export function useUnitPreference(): UnitPreference {
  const { data: profile } = useProfile();
  return resolveUnitPreference(profile?.unit_preference);
}
