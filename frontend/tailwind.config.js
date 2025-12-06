/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark obsidian theme with neon accents
        obsidian: {
          900: '#0a0a0f',
          800: '#12121a',
          700: '#1a1a25',
          600: '#252532',
          500: '#32324a',
        },
        neon: {
          cyan: '#00f5ff',
          purple: '#bf00ff',
          pink: '#ff00aa',
          green: '#00ff88',
          orange: '#ff6b35',
        },
        surface: {
          dark: '#0d0d14',
          card: '#15151f',
          hover: '#1e1e2d',
          border: '#2a2a3d',
        }
      },
      fontFamily: {
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        body: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'neon-cyan': '0 0 20px rgba(0, 245, 255, 0.3)',
        'neon-purple': '0 0 20px rgba(191, 0, 255, 0.3)',
        'neon-pink': '0 0 20px rgba(255, 0, 170, 0.3)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-pattern': 'linear-gradient(rgba(42, 42, 61, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(42, 42, 61, 0.3) 1px, transparent 1px)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px currentColor, 0 0 10px currentColor' },
          '100%': { boxShadow: '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor' },
        },
      },
    },
  },
  plugins: [],
}
