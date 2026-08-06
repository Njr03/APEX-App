import { ScrollViewStyleReset } from 'expo-router/html';
import type { ReactNode } from 'react';

import { APPLE_SPLASH_SCREENS } from '@/lib/pwa/appleSplashScreens';

const APP_BG = '#0a0a0f';
const THEME_COLOR = '#0a0a0f';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <meta name="theme-color" content={THEME_COLOR} />
        <meta name="application-name" content="APEX" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="APEX" />
        <meta
          name="description"
          content="Gamified strength training journal to track workouts, PRs, and progress."
        />

        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {APPLE_SPLASH_SCREENS.map(({ href, media }) => (
          <link key={href} href={href} media={media} rel="apple-touch-startup-image" />
        ))}

        <script dangerouslySetInnerHTML={{ __html: serviceWorkerRegistration }} />

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
body {
  background-color: ${APP_BG};
}`;

const serviceWorkerRegistration = `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Service worker is optional during local dev before export.
    });
  });
}
`;
