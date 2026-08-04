export type TrainingSplit = 'A' | 'B' | 'L';

export type SplitCardStatus = 'completed' | 'today' | 'upcoming';

export interface SplitDefinition {
  id: TrainingSplit;
  eyebrow: string;
  name: string;
  muscles: string;
  color: string;
  scheduledDay: number;
  completedBorder: string;
  todayBorder: string;
  todayGlow: string;
}

const SPLIT_ROTATION: TrainingSplit[] = ['A', 'B', 'L'];

export const SPLIT_DEFINITIONS: Record<TrainingSplit, SplitDefinition> = {
  A: {
    id: 'A',
    eyebrow: 'UPPER A',
    name: 'Arms & Chest',
    muscles: 'Chest, Triceps, Biceps',
    color: '#ff8c42',
    scheduledDay: 1,
    completedBorder: 'rgba(255,140,66,0.25)',
    todayBorder: 'rgba(255,140,66,0.40)',
    todayGlow: 'rgba(255,140,66,0.12)',
  },
  B: {
    id: 'B',
    eyebrow: 'UPPER B',
    name: 'Back & Shoulders',
    muscles: 'Back, Shoulders, Biceps',
    color: '#38d9f5',
    scheduledDay: 3,
    completedBorder: 'rgba(56,217,245,0.25)',
    todayBorder: 'rgba(56,217,245,0.40)',
    todayGlow: 'rgba(56,217,245,0.12)',
  },
  L: {
    id: 'L',
    eyebrow: 'LOWER',
    name: 'Legs',
    muscles: 'Quads, Hamstrings, Glutes, Calves',
    color: '#b06bff',
    scheduledDay: 5,
    completedBorder: 'rgba(176,107,255,0.25)',
    todayBorder: 'rgba(176,107,255,0.40)',
    todayGlow: 'rgba(176,107,255,0.12)',
  },
};

export const WEEKLY_SPLIT_ORDER: TrainingSplit[] = ['A', 'B', 'L'];

const SPLIT_NAME_PATTERNS: Record<TrainingSplit, RegExp[]> = {
  A: [
    /\bsplit\s*a\b/i,
    /\bupper\s*a\b/i,
    /\bpush\b/i,
    /\barms?\s*(?:&|and)\s*chest\b/i,
  ],
  B: [
    /\bsplit\s*b\b/i,
    /\bupper\s*b\b/i,
    /\bpull\b/i,
    /\bback\s*(?:&|and)\s*shoulders\b/i,
  ],
  L: [/\bsplit\s*l\b/i, /\blegs?\b/i, /\blower\b/i],
};

export function inferSplitFromWorkoutName(name: string): TrainingSplit | null {
  for (const split of SPLIT_ROTATION) {
    if (SPLIT_NAME_PATTERNS[split].some((pattern) => pattern.test(name))) {
      return split;
    }
  }

  return null;
}

export function getSplitWorkoutName(split: TrainingSplit): string {
  const definition = SPLIT_DEFINITIONS[split];
  return `${definition.eyebrow} — ${definition.name}`;
}

export function getNextSplit(lastSplit: TrainingSplit | null): TrainingSplit {
  if (!lastSplit) return 'A';

  const index = SPLIT_ROTATION.indexOf(lastSplit);
  if (index === -1) return 'A';

  return SPLIT_ROTATION[(index + 1) % SPLIT_ROTATION.length]!;
}

export function formatSplitLabel(split: TrainingSplit): string {
  return `Split ${split}`;
}

/** Human label for top bar / CTAs: "Upper A", "Upper B", "Lower". */
export function formatSplitTopBarLabel(split: TrainingSplit): string {
  return SPLIT_DEFINITIONS[split].eyebrow
    .split(' ')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

export function getTodaySplit(
  completedSplits: Set<TrainingSplit>,
): TrainingSplit | null {
  for (const split of WEEKLY_SPLIT_ORDER) {
    if (!completedSplits.has(split)) {
      return split;
    }
  }

  return null;
}

export function resolveSplitStatuses(
  completedSplits: Set<TrainingSplit>,
): Record<TrainingSplit, SplitCardStatus> {
  const todaySplit = getTodaySplit(completedSplits);

  return WEEKLY_SPLIT_ORDER.reduce(
    (acc, split) => {
      if (completedSplits.has(split)) {
        acc[split] = 'completed';
      } else if (split === todaySplit) {
        acc[split] = 'today';
      } else {
        acc[split] = 'upcoming';
      }
      return acc;
    },
    {} as Record<TrainingSplit, SplitCardStatus>,
  );
}
