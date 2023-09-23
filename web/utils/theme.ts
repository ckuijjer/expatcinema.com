import { Global, css } from '@emotion/react'
import { Libre_Baskerville, Libre_Franklin } from 'next/font/google'

export const headerFont = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
})

export const bodyFont = Libre_Franklin({
  subsets: ['latin'],
})

export const palette = {
  purple100: '#fff5f0' as const,
  purple200: '#ffe5e0' as const,
  purple300: '#ffafb0' as const,
  purple400: '#8c3547' as const,
  purple500: '#411d33' as const,
  purple600: '#310d23' as const,
}

export const globalStyles = css`
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

    --text-color: rgba(0, 0, 0, 0.9);
    --text-muted-color: rgba(0, 0, 0, 0.7);
    --text-inverse-color: rgba(255, 255, 255, 0.9);
    --text-inverse-muted-color: rgba(255, 255, 255, 0.7);

    --background-color: ${palette.purple100};
    --background-inverse-color: ${palette.purple600};
    --background-highlight-color: ${palette.purple200};

    --primary-color: ${palette.purple300};
    --secondary-color: ${palette.purple400};

    // note that in dark mode, there are no "inverse" colors
    @media (prefers-color-scheme: dark) {
      --text-color: rgba(255, 255, 255, 0.9);
      --text-muted-color: rgba(255, 255, 255, 0.7);
      --background-color: ${palette.purple600};
      --background-highlight-color: ${palette.purple500};
    }

    background-color: var(--background-color);
    color: var(--text-color);
  }
`
