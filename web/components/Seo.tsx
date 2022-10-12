import React from 'react'
import Head from 'next/head'

const DESCRIPTION = 'Foreign movies with English subtitles'
const AUTHOR = 'Expat Cinema'

function SEO({ title }) {
  const fullTitle = title ? `${title} | Expat Cinema` : 'Expat Cinema'

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta charSet="utf-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, shrink-to-fit=no"
      />
      <meta name="description" content={DESCRIPTION} />
      <meta name="og:title" content={fullTitle} />
      <meta name="og:description" content={DESCRIPTION} />
      <meta name="og:type" content="website" />
      <meta name="og:site_name" content="Expat Cinema" />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:creator" content={AUTHOR} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={DESCRIPTION} />
      <meta
        name="google-site-verification"
        content="dL5YABwMMr_oD9pxMofGesLOQ5s3Kq_l0sbLfURov1M"
      />
      <link rel="preconnect" href="https://www.google-analytics.com" />
      <link rel="dns-prefetch" href="https://www.google-analytics.com" />
      <link rel="canonical" href="https://expatcinema.com" />
      <link rel="icon" href="/favicon.ico" />
    </Head>
  )
}

export default SEO
