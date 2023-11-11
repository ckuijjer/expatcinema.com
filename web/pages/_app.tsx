import type { AppProps } from 'next/app'
import { Global } from '@emotion/react'
import { Settings } from 'luxon'
import Script from 'next/script'

import { globalStyles } from '../utils/theme'

Settings.defaultZone = 'Europe/Amsterdam'

const GA_TRACKING_ID = 'G-W3YQQJKL1T'

const GoogleAnalytics = () => (
  <>
    <Script
      async
      src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
    />
    <Script id="google-analytics">
      {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag('config', ${GA_TRACKING_ID});
  `}
    </Script>
  </>
)

function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Global styles={globalStyles} />
      <GoogleAnalytics />
      <Component {...pageProps} />
    </>
  )
}

export default App
