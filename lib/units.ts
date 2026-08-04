const KG_TO_LB = 2.20462;

/** Canonical storage is always kg in the database. */
export function kgToDisplay(
  kg: number | null | undefined,
  unit: 'kg' | 'lb',
): string {
  if (kg == null || Number.isNaN(kg)) return '';
  const value = unit === 'lb' ? kg * KG_TO_LB : kg;
  return formatWeight(value);
}

export function displayToKg(
  displayValue: string,
  unit: 'kg' | 'lb',
): number | null {
  const parsed = parseFloat(displayValue.replace(',', '.'));
  if (Number.isNaN(parsed)) return null;
  return unit === 'lb' ? parsed / KG_TO_LB : parsed;
}

export function formatWeight(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function weightUnitLabel(unit: 'kg' | 'lb'): string {
  return unit === 'lb' ? 'lbs' : 'kg';
}

export function volumeLabel(unit: 'kg' | 'lb'): string {
  return unit === 'lb' ? 'lbs' : 'kg';
}
