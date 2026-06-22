/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060E1F',
          900: '#0A1530',
          800: '#0F1F44',
          700: '#142C5E',
          600: '#1B3A7A',
          500: '#244B96',
        },
        gold: {
          50: '#FBF3DC',
          100: '#F6E6B8',
          200: '#EFD487',
          300: '#E6BE57',
          400: '#DCAA3C',
          500: '#D4A537',
          600: '#B6862A',
          700: '#8F6720',
        },
        ink: {
          50: '#F6F8FB',
          100: '#EEF1F7',
          200: '#E2E7F0',
          300: '#C9D1E0',
          400: '#9AA6BC',
          500: '#6B7690',
          600: '#4C5670',
          700: '#363F57',
          800: '#232A3D',
          900: '#161B29',
        },
        success: { 50: '#E8F8EF', 500: '#1FAE5C', 600: '#178A48' },
        warning: { 50: '#FEF5E7', 500: '#E69A1F', 600: '#C27E10' },
        danger:  { 50: '#FCEAEA', 500: '#DE4B4B', 600: '#BD3636' },
      },
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      backgroundImage: {
        'navy-gradient': 'linear-gradient(160deg, #0A1530 0%, #142C5E 55%, #1B3A7A 100%)',
        'gold-gradient': 'linear-gradient(135deg, #F6E6B8 0%, #D4A537 50%, #B6862A 100%)',
        'aurora': 'radial-gradient(60% 60% at 20% 10%, rgba(36,75,150,0.55) 0%, rgba(10,21,48,0) 70%), radial-gradient(50% 50% at 85% 80%, rgba(212,165,55,0.25) 0%, rgba(10,21,48,0) 70%)',
        'card-sheen': 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 60%)',
      },
      boxShadow: {
        'soft': '0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)',
        'card': '0 4px 16px -4px rgba(15,31,68,0.10), 0 2px 6px -2px rgba(15,31,68,0.06)',
        'lift': '0 12px 32px -8px rgba(15,31,68,0.20), 0 4px 12px -4px rgba(15,31,68,0.10)',
        'glow-gold': '0 0 0 1px rgba(212,165,55,0.4), 0 8px 24px -6px rgba(212,165,55,0.35)',
      },
      borderRadius: {
        'xl2': '1.25rem',
      },
      keyframes: {
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        ringSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.55 },
        },
      },
      animation: {
        floatSlow: 'floatSlow 7s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        fadeUp: 'fadeUp 0.5s ease-out forwards',
        ringSpin: 'ringSpin 6s linear infinite',
        pulseSoft: 'pulseSoft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
