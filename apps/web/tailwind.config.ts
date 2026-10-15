import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        surface: {
          DEFAULT: '#101010',
          subtle: '#151515',
          hover: '#1c1c1c',
          border: 'rgba(255,255,255, 0.12)',
          'border-light': 'rgba(255,255,255, 0.20)',
          line: '#262626',
        },
        emerald: {
          DEFAULT: '#e5e5e5',
          bright: '#ffffff',
          dark: '#b5b5b5',
          deep: '#6d6d6d',
          muted: 'rgba(229,229,229, 0.15)',
        },
        brand: {
          DEFAULT: '#e5e5e5',
          hover: '#ffffff',
          dark: '#b5b5b5',
          muted: 'rgba(229,229,229, 0.15)',
        },
        // Silver tones follow the brushed-metal N mark (public/brand/nash-mark.png).
        silver: {
          DEFAULT: '#c4c4c4',
          light: '#e5e5e5',
        },
        muted: {
          DEFAULT: '#8d8d8d',
          dark: '#6d6d6d',
        },
        danger: {
          DEFAULT: '#d6153c',
          muted: 'rgba(214,21,60, 0.15)',
        },
      },
      fontFamily: {
        sans: ['Montserrat', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['Newsreader', 'Iowan Old Style', 'Georgia', 'serif'],
        heroDisplay: ['Montserrat', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        hand: ['Caveat', '"Bradley Hand"', 'cursive'],
      },
      borderRadius: {
        DEFAULT: '4px',
        sm: '2px',
        md: '4px',
        lg: '6px',
        xl: '8px',
        full: '9999px',
      },
      letterSpacing: {
        tightest: '-0.06em',
        tighter: '-0.04em',
        widest: '0.15em',
      },
    },
  },
  plugins: [],
};

export default config;

