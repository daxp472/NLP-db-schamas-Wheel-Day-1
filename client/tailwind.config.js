/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        workbench: {
          bg: '#0B0D13',
          surface: '#12151F',
          elevated: '#181C2A',
          overlay: '#1F2438',
          border: '#23283B',
          'border-subtle': '#1B1F2E',
          'border-active': '#3B4463',
          muted: '#717D9B',
          text: '#E2E8F0',
          heading: '#F8FAFC',
          cyan: '#00D2FF',
          'cyan-glow': 'rgba(0, 210, 255, 0.15)',
          emerald: '#10B981',
          amber: '#F59E0B',
          crimson: '#EF4444',
          violet: '#8B5CF6',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'panel': '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 0 0 1px #23283B',
        'glow-cyan': '0 0 15px rgba(0, 210, 255, 0.25)',
      }
    },
  },
  plugins: [],
}
