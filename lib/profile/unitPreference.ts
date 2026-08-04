export type UnitPreference = 'kg' | 'lb';

/** Default weight unit across the app when the profile has no preference saved. */
export const DEFAULT_UNIT_PREFERENCE: UnitPreference = 'lb';

export function resolveUnitPreference(
  value: UnitPreference | null | undefined,
): UnitPreference {
  return value ?? DEFAULT_UNIT_PREFERENCE;
}

export function formatUnitPreferenceLabel(unit: UnitPreference): string {
  return unit === 'lb' ? 'LBS' : 'KG';
}
