import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: '#0b1120',
        surface2: '#111827',
        border: '#25303f',
        muted: '#94a3b8',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      boxShadow: {
        soft: '0 20px 55px rgba(15, 23, 42, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
