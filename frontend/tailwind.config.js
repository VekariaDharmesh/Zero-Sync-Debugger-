/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          dark: 'var(--bg-dark, #03050d)',
          card: 'var(--bg-card, #0c0f24)',
          input: '#0e122b',
        },
        primary: {
          DEFAULT: 'var(--primary, #6366f1)',
          hover: 'var(--primary-hover, #4f46e5)',
          soft: 'var(--primary-soft, rgba(99, 102, 241, 0.08))',
        },
        success: {
          DEFAULT: '#10b981',
          soft: 'rgba(16, 185, 129, 0.08)',
        },
        error: {
          DEFAULT: '#ef4444',
          soft: 'rgba(239, 68, 68, 0.08)',
        },
        warning: {
          DEFAULT: '#f59e0b',
          soft: 'rgba(245, 158, 11, 0.08)',
        },
        accent: {
          purple: '#a855f7',
          pink: '#ec4899',
          blue: '#3b82f6',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'glow': 'var(--shadow-glow, 0 0 20px rgba(99, 102, 241, 0.15))',
        'glow-success': '0 0 20px rgba(16, 185, 129, 0.15)',
        'glow-error': '0 0 20px rgba(239, 68, 68, 0.15)',
        'glow-purple': '0 0 25px rgba(168, 85, 247, 0.2)',
      },
      borderRadius: {
        'xl': '14px',
        '2xl': '20px',
        '3xl': '24px',
      }
    },
  },
  plugins: [],
}
