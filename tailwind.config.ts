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
        danger: '#dc2626',
        warning: '#f59e0b',
        watch: '#3b82f6',
        safe: '#10b981',
      },
    },
  },
  plugins: [],
}
export default config
