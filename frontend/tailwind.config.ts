import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        background: 'var(--color-background)',
        text: 'var(--color-text)',
        accent: 'var(--color-accent)',
        light: 'var(--color-light)',
        muted: 'var(--color-muted)',
        white: 'var(--color-white)',
        'lavender-light': 'var(--color-lavender-light)',
        blush: 'var(--color-blush)',
      },
      fontFamily: {
        heading: 'var(--font-heading)',
        body: 'var(--font-body)',
        script: 'var(--font-script)',
      },
    },
  },
  plugins: [],
}

export default config
