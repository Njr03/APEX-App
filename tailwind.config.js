/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0f',
        surface: '#111118',
        surface2: '#1a1a24',
        border: 'rgba(255,255,255,0.08)',
        text: '#f0ede8',
        muted: 'rgba(240,237,232,0.5)',
        accent: '#c8ff5a',
        accent2: '#5affb8',
        accent3: '#ff6b6b',
        accent4: '#a78bfa',
        gold: '#f5c842',
      },
      fontFamily: {
        display: ['Syne_700Bold', 'Syne_800ExtraBold'],
        'display-bold': ['Syne_800ExtraBold'],
        body: ['InstrumentSans_400Regular', 'InstrumentSans_500Medium', 'InstrumentSans_600SemiBold'],
        mono: ['DMMono_400Regular', 'DMMono_500Medium'],
      },
      borderRadius: {
        DEFAULT: '12px',
        lg: '16px',
        md: '10px',
      },
    },
  },
  plugins: [],
};
