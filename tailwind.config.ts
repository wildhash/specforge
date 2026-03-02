import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/pages/**/*.{js,ts,jsx,tsx,mdx}', './src/components/**/*.{js,ts,jsx,tsx,mdx}', './src/app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: { border: 'hsl(var(--border))', background: 'hsl(var(--background))', foreground: 'hsl(var(--foreground))' },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'], mono: ['JetBrains Mono', 'Fira Code', 'monospace'] },
      animation: { 'spin-slow': 'spin 3s linear infinite', 'pulse-slow': 'pulse 3s ease-in-out infinite', 'fade-in': 'fade-in 0.5s ease-out forwards' },
      keyframes: { 'fade-in': { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } } },
    },
  },
  plugins: [],
};

export default config;
