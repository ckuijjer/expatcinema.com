import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  preflight: false,

  include: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './utils/**/*.{ts,tsx}',
  ],

  exclude: [],

  theme: {
    extend: {},
  },

  outdir: 'styled-system',
})
