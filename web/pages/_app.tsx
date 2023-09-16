import type { AppProps } from 'next/app'
import { Global, css } from '@emotion/react'
import { Libre_Baskerville, Libre_Franklin } from 'next/font/google'
import { Settings } from 'luxon'

Settings.defaultZone = 'Europe/Amsterdam'

export const headerFont = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
})

export const bodyFont = Libre_Franklin({
  subsets: ['latin'],
})

const palette = {
  pink100: '#FFF5F0' as const,
  pink200: '#ffe5e0' as const,
  pink300: '#FFAFB0' as const,
  purple200: '#240a1a' as const,
  white100: '#FFFFFF' as const,
  white200: '#F6F6F6' as const,
}

const globalStyles = css`
  body {
    margin: 0;
    padding: 0;
    font-family:
      ${bodyFont.style.fontFamily},
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      'Roboto',
      'Oxygen',
      'Ubuntu',
      'Cantarell',
      'Fira Sans',
      'Droid Sans',
      'Helvetica Neue',
      sans-serif;

    --text-color: #333;
    --text-muted-color: #888;
    --text-inverse-color: ${palette.pink100};
    --text-menu-color: ${palette.pink100};
    --background-inverse-color: ${palette.purple200};
    --background-color: ${palette.pink100};
    --background-highlight-color: ${palette.pink200};
    --background-menu-color: ${palette.purple200};
    --background-filter-color: ${palette.purple200};
    --background-filter-active-color: ${palette.pink300};
    --primary-color: ${palette.purple200};

    @media (prefers-color-scheme: dark) {
      --text-color: #eee;
      --text-muted-color: #555;
      --text-menu-color: #eee;
      --background-color: #121212;
      --background-highlight-color: #1f1f1f;
    }

    background-color: var(--background-color);
    color: var(--text-color);
  }
`
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Global styles={globalStyles} />
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
