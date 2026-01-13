import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Aurora color palette
        aurora: {
          green: '#88C0A3',
          teal: '#6BCFCF',
          blue: '#7BA3D4',
          purple: '#9B8ED4',
          pink: '#D4A3C0',
          dark: '#0A0A1B',
          darker: '#050510',
        },
        // Game-specific colors
        game: {
          thought: '#F59E0B',    // Amber - Finish My Thought
          answer: '#10B981',     // Emerald - Quick Answer
          story: '#8B5CF6',      // Violet - Storyteller
          memory: '#EC4899',     // Pink - Memory Lane
          numbers: '#3B82F6',    // Blue - Number Dictation
        },
        // Status colors
        complete: '#22C55E',
        incomplete: '#F97316',
      },
      fontFamily: {
        display: ['Clash Display', 'sans-serif'],
        body: ['Satoshi', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'aurora-gradient': 'linear-gradient(135deg, #0A0A1B 0%, #1A1A3E 25%, #0D2035 50%, #1A1A3E 75%, #0A0A1B 100%)',
        'aurora-glow': 'radial-gradient(ellipse at 50% 0%, rgba(107, 207, 207, 0.15) 0%, transparent 50%)',
        'card-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      },
      animation: {
        'aurora': 'aurora 15s ease infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'recording': 'recording 1.5s ease-in-out infinite',
      },
      keyframes: {
        aurora: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(107, 207, 207, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(107, 207, 207, 0.6)' },
        },
        recording: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.1)', opacity: '0.8' },
        },
      },
      boxShadow: {
        'aurora': '0 0 60px rgba(107, 207, 207, 0.2)',
        'card': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'glow-green': '0 0 30px rgba(136, 192, 163, 0.4)',
        'glow-blue': '0 0 30px rgba(123, 163, 212, 0.4)',
      },
    },
  },
  plugins: [],
}
export default config
