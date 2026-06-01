import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#FF7A00', deep: '#E85D04', light: '#FFF3E6' },
        ink: { DEFAULT: '#1F2937', soft: '#4B5563' },
        accent: '#111827',
        canvas: '#FFF8F0',
      },
      fontFamily: { sans: ['var(--font-sans)', 'system-ui', 'sans-serif'] },
      boxShadow: {
        soft: '0 4px 24px -6px rgba(232, 93, 4, 0.18)',
        card: '0 2px 16px -4px rgba(17, 24, 39, 0.10)',
      },
    },
  },
  plugins: [],
};

export default config;
