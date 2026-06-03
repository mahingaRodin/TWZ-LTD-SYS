/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#101418',
        surface: '#1B232D',
        primary: '#D72638',
        secondary: '#F4A261',
        accent: '#2A9D8F',
        text: '#F8FAFC',
        muted: '#94A3B8',
        border: '#2D3748',
        success: '#22C55E',
        danger: '#EF4444',
        warning: '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '0.75rem',
        input: '0.375rem',
      },
      maxWidth: {
        form: '800px',
        container: '1440px',
      },
      boxShadow: {
        card: '0 4px 24px rgba(0, 0, 0, 0.25)',
        glow: '0 0 0 3px rgba(215, 38, 56, 0.25)',
      },
      backdropBlur: {
        glass: '20px',
      },
    },
  },
  plugins: [],
};
