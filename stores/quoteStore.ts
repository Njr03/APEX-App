import { create } from 'zustand';

import { getRandomQuote, type Quote } from '@/lib/quotes';

type QuoteStore = {
  isVisible: boolean;
  currentQuote: Quote;
  openQuote: () => void;
  closeQuote: () => void;
  nextQuote: () => void;
};

export const useQuoteStore = create<QuoteStore>((set) => ({
  isVisible: false,
  currentQuote: getRandomQuote(),

  openQuote: () =>
    set({
      isVisible: true,
      currentQuote: getRandomQuote(),
    }),

  closeQuote: () => set({ isVisible: false }),

  nextQuote: () => set({ currentQuote: getRandomQuote() }),
}));
