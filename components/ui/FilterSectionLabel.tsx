import { AppText } from '@/components/ui/AppText';

/** Matches Lifts tab filter headings (e.g. Muscle group). */
export function FilterSectionLabel({ children }: { children: string }) {
  return (
    <AppText className="text-xs uppercase tracking-wide" variant="muted">
      {children}
    </AppText>
  );
}
