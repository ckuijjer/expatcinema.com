'use client'

import Script from 'next/script'

const GA_TRACKING_ID = 'G-W3YQQJKL1T'

export const GoogleAnalytics = () => (
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

    gtag('config', '${GA_TRACKING_ID}');
  `}
    </Script>
  </>
)
