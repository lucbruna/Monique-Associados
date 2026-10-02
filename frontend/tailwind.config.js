/** @type {import('tailwindcss').Config} */
export default {
  // Classe `dark` no <html> controlada pelo toggle do Header. O modo de
  // midia deixaria o usuario preso ao tema do sistema operacional.
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', '"Times New Roman"', 'serif'],
      },
      colors: {
        // Navy institucional — sofisticado, combina com ouro
        primary: {
          50: '#eef3f9',
          100: '#d9e4f0',
          200: '#b3c9e1',
          300: '#84a7cb',
          400: '#4f7db0',
          500: '#2f5e94',
          600: '#234a7a',
          700: '#1d3c63',
          800: '#193252',
          900: '#162b45',
        },
        // Escala dourada refinada (champagne → bronze)
        gold: {
          50: '#faf7ec',
          100: '#f4eed6',
          200: '#e9dcae',
          300: '#ddc47c',
          400: '#d1ab52',
          500: '#c2973a',
          600: '#a87a2d',
          700: '#865e26',
          800: '#6e4c24',
          900: '#5d4022',
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.10)',
        'card-hover': '0 2px 4px rgba(15,23,42,0.05), 0 16px 40px -16px rgba(15,23,42,0.16)',
        glow: '0 8px 32px -8px rgba(194,151,58,0.45)',
        'glow-gold': '0 10px 30px -10px rgba(194,151,58,0.55)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
