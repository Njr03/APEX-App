import { useEffect } from 'react';
import { Platform } from 'react-native';

import { colors } from '@/constants/theme';

const THEME_COLOR = colors.bg;

function applyDarkBrowserChrome() {
  document.documentElement.style.colorScheme = 'dark';
  document.documentElement.style.backgroundColor = THEME_COLOR;
  document.body.style.backgroundColor = THEME_COLOR;

  const root = document.getElementById('root');
  if (root) {
    root.style.backgroundColor = THEME_COLOR;
    root.style.minHeight = '100dvh';
  }

  const themeMeta =
    document.querySelector('meta[name="theme-color"]') ??
    (() => {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
      return meta;
    })();
  themeMeta.setAttribute('content', THEME_COLOR);

  const colorSchemeMeta =
    document.querySelector('meta[name="color-scheme"]') ??
    (() => {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'color-scheme');
      document.head.appendChild(meta);
      return meta;
    })();
  colorSchemeMeta.setAttribute('content', 'dark');
}

/** Keeps mobile browser chrome (status bar tint, page backdrop) aligned with the app theme on web. */
export function WebBrowserChrome() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    applyDarkBrowserChrome();
  }, []);

  return null;
}
