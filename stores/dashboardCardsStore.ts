import { create } from 'zustand';

import {
  DEFAULT_DASHBOARD_CARDS,
  dashboardCardKey,
  type DashboardCardRef,
} from '@/lib/dashboard/dashboardCards';
import { getPlatformItem, setPlatformItem } from '@/lib/storage/platformStorage';
import type { TrainingSplit } from '@/lib/training/splits';

const STORAGE_KEY = 'apex_dashboard_cards_v1';

interface DashboardCardsState {
  cards: DashboardCardRef[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setCards: (cards: DashboardCardRef[]) => Promise<void>;
  addCard: (card: DashboardCardRef) => Promise<void>;
  removeCard: (key: string) => Promise<void>;
  replaceCard: (key: string, next: DashboardCardRef) => Promise<void>;
}

async function persistCards(cards: DashboardCardRef[]) {
  await setPlatformItem(STORAGE_KEY, JSON.stringify(cards));
}

export const useDashboardCardsStore = create<DashboardCardsState>((set, get) => ({
  cards: DEFAULT_DASHBOARD_CARDS,
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;

    try {
      const raw = await getPlatformItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DashboardCardRef[];
        if (Array.isArray(parsed)) {
          set({ cards: parsed, hydrated: true });
          return;
        }
      }
    } catch {
      // fall through to defaults
    }

    set({ cards: DEFAULT_DASHBOARD_CARDS, hydrated: true });
  },

  setCards: async (cards) => {
    set({ cards });
    await persistCards(cards);
  },

  addCard: async (card) => {
    const current = get().cards;
    if (current.some((entry) => dashboardCardKey(entry) === dashboardCardKey(card))) {
      return;
    }

    const next = [...current, card];
    set({ cards: next });
    await persistCards(next);
  },

  removeCard: async (key) => {
    const next = get().cards.filter((card) => dashboardCardKey(card) !== key);
    set({ cards: next });
    await persistCards(next);
  },

  replaceCard: async (key, replacement) => {
    const current = get().cards;
    const replacementKey = dashboardCardKey(replacement);

    if (
      current.some(
        (card) =>
          dashboardCardKey(card) === replacementKey && dashboardCardKey(card) !== key,
      )
    ) {
      return;
    }

    const next = current.map((card) =>
      dashboardCardKey(card) === key ? replacement : card,
    );
    await get().setCards(next);
  },
}));

export function splitCardRef(split: TrainingSplit): DashboardCardRef {
  return { kind: 'split', split };
}

export function routineCardRef(routineId: string): DashboardCardRef {
  return { kind: 'routine', routineId };
}
