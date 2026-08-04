export interface ProfileIconPreset {
  label: string;
  seed: string;
}

export const PROFILE_ICON_PRESETS: ProfileIconPreset[] = [
  { label: 'Trophy', seed: 'trophy' },
  { label: 'Flame', seed: 'flame' },
  { label: 'Star', seed: 'star' },
  { label: 'Bolt', seed: 'bolt' },
  { label: 'Shield', seed: 'shield' },
];

export function getProfileIconUrl(seed: string): string {
  return `https://api.dicebear.com/7.x/shapes/png?seed=${encodeURIComponent(seed)}&backgroundColor=141427`;
}
