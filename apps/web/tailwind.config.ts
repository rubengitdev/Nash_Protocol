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
        background: '#050a18',
        surface: {
          DEFAULT: '#0b1429',
          subtle: '#0e1a33',
          hover: '#13244a',
          border: 'rgba(255, 255, 255, 0.12)',
          'border-light': 'rgba(255, 255, 255, 0.20)',
          line: '#1a2a4d',
        },
        emerald: {
          DEFAULT: '#2ee6a6',
          bright: '#7df2c8',
          dark: '#14b07f',
          deep: '#0a7a58',
          muted: 'rgba(46, 230, 166, 0.15)',
        },
        brand: {
          DEFAULT: '#2ee6a6',
          hover: '#7df2c8',
          dark: '#14b07f',
          muted: 'rgba(46, 230, 166, 0.15)',
        },
        // Silver tones follow the brushed-metal N mark (public/brand/nash-mark.png).
        silver: {
          DEFAULT: '#b8c2d4',
          light: '#dce3f0',
        },
        muted: {
          DEFAULT: '#8e9bb8',
          dark: '#5f6d8e',
        },
        danger: {
          DEFAULT: '#d6153c',
          muted: 'rgba(214, 21, 60, 0.15)',
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

