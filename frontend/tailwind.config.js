/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        atonement: {
          bg: '#fee2e2',
          surface: '#fef2f2',
          card: '#ffffff',
          border: '#cbd5e1',
          accent: '#8b9db5',
          'accent-light': '#a3b5c9',
          cyan: '#8b9db5',
          'cyan-light': '#a3b5c9',
          text: '#334155',
          muted: '#64748b',
          success: '#10b981',
          warning: '#f9e2af',
        },
      },
      animation: {
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(139, 157, 181, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(139, 157, 181, 0.6)' },
        },
      },
    },
  },
  plugins: [],
};
