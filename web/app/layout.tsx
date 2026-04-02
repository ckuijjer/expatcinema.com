import type { Metadata } from 'next'
import { Settings } from 'luxon'
import React from 'react'

import '../styles/globals.css'
import { bodyFont } from '../utils/theme'
import { GoogleAnalytics } from './GoogleAnalytics'

Settings.defaultZone = 'Europe/Amsterdam'

export const metadata: Metadata = {
  description: 'Foreign movies with English subtitles',
  openGraph: {
    type: 'website',
    siteName: 'Expat Cinema',
    description: 'Foreign movies with English subtitles',
  },
  twitter: {
    card: 'summary',
    creator: 'Expat Cinema',
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
        {children}
      </body>
    </html>
  )
}
