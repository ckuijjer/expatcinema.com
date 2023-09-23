import type { AppProps } from 'next/app'
import { Global } from '@emotion/react'
import { Settings } from 'luxon'

import { globalStyles } from '../utils/theme'

Settings.defaultZone = 'Europe/Amsterdam'

function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Global styles={globalStyles} />
      <Component {...pageProps} />
    </>
  )
}

export default App
