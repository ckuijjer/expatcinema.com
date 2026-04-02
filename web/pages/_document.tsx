import { Head, Html, Main, NextScript } from 'next/document'

import { bodyFont } from '../utils/theme'

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body className={bodyFont.className}>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
