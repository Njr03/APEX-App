/** Workbox config — run after `expo export -p web`. */
module.exports = {
  globDirectory: 'dist',
  globPatterns: [
    '**/*.{html,js,css,ico,png,json,woff2,ttf,svg}',
  ],
  swDest: 'dist/sw.js',
  navigateFallback: '/index.html',
  navigateFallbackDenylist: [/^\/_/, /\/[^/?]+\.[^/]+$/],
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-api',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 60 * 5,
        },
      },
    },
  ],
};
