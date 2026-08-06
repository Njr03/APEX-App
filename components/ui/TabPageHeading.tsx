import { AppText } from '@/components/ui/AppText';
import { cn } from '@/lib/cn';

interface TabPageHeadingProps {
  title: string;
  className?: string;
}

/** Page title style aligned with filter section labels, slightly larger than chip group labels. */
export function TabPageHeading({ title, className }: TabPageHeadingProps) {
  return (
    <AppText
      className={cn('text-sm uppercase tracking-wide', className)}
      variant="muted"
    >
      {title}
    </AppText>
  );
}
