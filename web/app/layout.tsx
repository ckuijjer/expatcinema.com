import type { Metadata } from 'next'
import { Settings } from 'luxon'
import React from 'react'

import '../styles/globals.css'
import { defaultDescription, defaultSocialImage } from '../utils/seoMetadata'
import { bodyFont } from '../utils/theme'
import { siteUrl } from '../utils/siteUrl'
import { GoatCounter } from './GoatCounter'
import { GoogleAnalytics } from './GoogleAnalytics'

Settings.defaultZone = 'Europe/Amsterdam'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  description: defaultDescription,
  openGraph: {
    type: 'website',
    siteName: 'Expat Cinema',
    description: defaultDescription,
    images: [defaultSocialImage],
  },
  twitter: {
    card: 'summary_large_image',
    creator: 'Expat Cinema',
    images: [defaultSocialImage.url],
  },
  verification: {
    google: 'dL5YABwMMr_oD9pxMofGesLOQ5s3Kq_l0sbLfURov1M',
  },
  icons: { icon: '/favicon.ico' },
  other: {
    'msapplication-TileColor': '#ffffff',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={bodyFont.className}>
        <GoogleAnalytics />
        <GoatCounter />
        {children}
      </body>
    </html>
  )
}
