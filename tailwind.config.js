/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      container: {
        center: true,
        padding: '1rem',
      },
      fontFamily: {
        figtree: ['var(--font-figtree)'],
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: 'inherit',
            a: {
              color: '#3b82f6',
              '&:hover': {
                color: '#2563eb',
              },
            },
            code: {
              color: 'inherit',
              backgroundColor: 'rgb(var(--tw-prose-pre-bg))',
              padding: '0.25rem',
              borderRadius: '0.25rem',
              fontWeight: '400',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            pre: {
              backgroundColor: 'rgb(var(--tw-prose-pre-bg))',
              color: 'inherit',
            },
            hr: {
              borderColor: 'currentColor',
              opacity: 0.1,
            },
            thead: {
              borderBottomColor: 'currentColor',
              borderBottomWidth: '1px',
            },
            'tbody tr': {
              borderBottomColor: 'currentColor',
              borderBottomWidth: '1px',
            },
            blockquote: {
              color: 'inherit',
              borderLeftColor: 'currentColor',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
  safelist: [
    {
      pattern: /bg-(gray|green)-(50|100|200|300|400|500|600|700|800|900)/,
      variants: ['hover'],
    },
    {
      pattern: /text-(gray|green)-(50|100|200|300|400|500|600|700|800|900)/,
      variants: ['hover'],
    },
    {
      pattern: /border-(gray|green)-(50|100|200|300|400|500|600|700|800|900)/,
      variants: ['hover'],
    }
  ]
}
