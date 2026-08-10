import { Platform } from 'react-native';
import type { BlurEvent } from 'react-native';

/** iOS Safari zooms focused inputs with font-size below 16px. */
export const WEB_NUMERIC_INPUT_FONT_SIZE = Platform.OS === 'web' ? 16 : undefined;

export function resetViewportZoom() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;

  const viewport = document.querySelector('meta[name="viewport"]');
  if (!viewport) return;

  const content = viewport.getAttribute('content');
  if (!content) return;

  viewport.setAttribute('content', `${content}, maximum-scale=1`);

  requestAnimationFrame(() => {
    viewport.setAttribute('content', content);
  });
}

export function handleNumericInputBlur(onBlur?: (event: BlurEvent) => void) {
  return (event: BlurEvent) => {
    onBlur?.(event);
    resetViewportZoom();
  };
}
