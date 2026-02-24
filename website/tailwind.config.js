/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FC5531',
          light: '#FF7A5C',
          dark: '#E04020',
          50: '#FFF5F2',
          100: '#FFE8E2',
          500: '#FC5531',
          600: '#E04020',
          700: '#C43018'
        },
        surface: {
          DEFAULT: '#1a1a2e',
          light: '#25253d',
          dark: '#0f0f1a',
          card: '#1e1e32'
        },
        success: {
          DEFAULT: '#10B981',
          light: '#34D399'
        },
        danger: {
          DEFAULT: '#EF4444',
          light: '#F87171'
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FBBF24'
        }
      },
      fontFamily: {
        sans: ['Inter', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace']
      },
      boxShadow: {
        'glow': '0 0 20px rgba(252, 85, 49, 0.3)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.25)',
        'elevated': '0 8px 32px rgba(0, 0, 0, 0.4)'
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(252, 85, 49, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(252, 85, 49, 0.5)' }
        }
      }
    },
  },
  plugins: [],
}
