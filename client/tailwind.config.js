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
        chalk: {
          DEFAULT: 'var(--chalk-primary)',
          hover: 'var(--chalk-hover)',
          dark: 'var(--chalk-dark)',
        },
        dark: {
          bg: 'var(--bg-main)',
          secondary: 'var(--bg-secondary)',
          card: 'var(--card)',
          cardSecondary: 'var(--card-secondary)',
          cardHover: 'var(--card-hover)',
          border: 'var(--border)',
          borderSubtle: 'var(--border-subtle)',
          borderActive: 'var(--border-active)',
        },
        red: {
          primary: 'var(--red-primary)',
          intense: 'var(--red-intense)',
          dark: 'var(--red-dark)',
          hover: 'var(--red-hover)',
          subtle: 'var(--red-subtle)',
          border: 'var(--red-border)',
        },
        accent: {
          orange: 'var(--accent-orange)',
          orangeBg: 'var(--accent-orange-bg)',
          green: 'var(--accent-green)',
          greenBg: 'var(--accent-green-bg)',
        },
      },
    },
  },
  plugins: [],
}
