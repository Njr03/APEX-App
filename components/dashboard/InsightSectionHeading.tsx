import { AppText } from '@/components/ui/AppText';
import { fonts } from '@/constants/theme';

/** Matches the "This Week" dashboard section heading style. */
export const DASHBOARD_SECTION_HEADING_STYLE = {
  color: 'rgba(240,237,232,0.5)',
  fontFamily: fonts.jetbrainsMono,
  fontSize: 11,
  letterSpacing: 0.3,
  textTransform: 'uppercase',
} as const;

export function InsightSectionHeading({ title }: { title: string }) {
  return <AppText style={DASHBOARD_SECTION_HEADING_STYLE}>{title}</AppText>;
}
