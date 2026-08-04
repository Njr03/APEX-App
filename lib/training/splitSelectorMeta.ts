import { SPLIT_TEMPLATES } from '@/lib/training/splitTemplates';
import type { TrainingSplit } from '@/lib/training/splits';

export const SPLIT_EMOJIS: Record<TrainingSplit, string> = {
  A: '💪',
  B: '🏋️',
  L: '🦵',
};

export function estimateSplitDurationMinutes(split: TrainingSplit): number {
  const exerciseCount = SPLIT_TEMPLATES[split].length;
  return Math.round(exerciseCount * 12);
}

export function splitSessionTag(split: TrainingSplit): string {
  const exerciseCount = SPLIT_TEMPLATES[split].length;
  const minutes = estimateSplitDurationMinutes(split);
  return `${exerciseCount} exercises · ~${minutes} min`;
}

export function splitHoverBorder(split: TrainingSplit): string {
  const borders: Record<TrainingSplit, string> = {
    A: 'rgba(255,140,66,0.4)',
    B: 'rgba(56,217,245,0.4)',
    L: 'rgba(176,107,255,0.4)',
  };
  return borders[split];
}

export function splitHoverGlow(split: TrainingSplit): string {
  const glows: Record<TrainingSplit, string> = {
    A: 'rgba(255,140,66,0.12)',
    B: 'rgba(56,217,245,0.12)',
    L: 'rgba(176,107,255,0.12)',
  };
  return glows[split];
}

export function splitDimBackground(split: TrainingSplit): string {
  const backgrounds: Record<TrainingSplit, string> = {
    A: 'rgba(255,140,66,0.08)',
    B: 'rgba(56,217,245,0.08)',
    L: 'rgba(176,107,255,0.08)',
  };
  return backgrounds[split];
}
