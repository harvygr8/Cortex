/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      container: {
        center: true,
        padding: '1rem',
      },
      fontFamily: {
        'pt-sans': ['var(--font-pt-sans)'],
        'ibm-plex-sans': ['var(--font-ibm-plex-sans)'],
        'source-sans-3': ['var(--font-source-sans-3)'], // Keep for backward compatibility
      },
    },
  },
  plugins: [],
  safelist: [
    {
      pattern: /bg-(gray|green|neutral|blue|amber|emerald)-(50|100|200|300|400|500|600|700|800|900)/,
      variants: ['hover'],
    },
    {
      pattern: /text-(gray|green|neutral|blue|amber|emerald)-(50|100|200|300|400|500|600|700|800|900)/,
      variants: ['hover'],
    },
    {
      pattern: /border-(gray|green|neutral|blue|amber|emerald)-(50|100|200|300|400|500|600|700|800|900)/,
      variants: ['hover'],
    },
    'line-clamp-1',
    'line-clamp-2',
    'line-clamp-3'
  ]
}
