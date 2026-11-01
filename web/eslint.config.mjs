import { defineConfig } from 'eslint/config'
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'

export default defineConfig([
  {
    ignores: ['styled-system/**', 'out/**', 'out-next/**'],
  },
  {
    extends: [...nextCoreWebVitals],
    rules: {
      'react/no-unescaped-entities': 'off',
    },
  },
])
