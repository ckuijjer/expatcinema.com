import type { AppProps } from 'next/app'
import Layout from '../components/Layout'
import { Global, css } from '@emotion/react'
import { Libre_Baskerville, Libre_Franklin } from '@next/font/google'

export const headerFont = Libre_Baskerville({
  subsets: ['latin'],
  weight: '400',
})

export const bodyFont = Libre_Franklin({ subsets: ['latin'] })

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
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;

    --text-color: #333;
    --text-muted-color: #888;
    --text-menu-color: #f6f6f6;
    --background-color: #fff;
    --background-highlight-color: #f6f6f6;
    --background-menu-color: #240a1a;
    --background-filter-color: #ffafb0;
    --primary-color: #0650d0;

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
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </>
  )
}

export default MyApp
