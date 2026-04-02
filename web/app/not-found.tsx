import Link from 'next/link'
import { Suspense } from 'react'

import { Layout } from '../components/Layout'
import { NavigationBar } from '../components/NavigationBar'
import { PageTitle } from '../components/PageTitle'
import { palette } from '../utils/theme'

const textLinkStyle = { color: 'var(--secondary-color)' }

export default function NotFound() {
  return (
    <Suspense>
      <Layout backgroundColor={palette.purple600}>
        <NavigationBar showSearch={false} />
      </Layout>
      <Layout>
        <PageTitle>Page not found</PageTitle>
        <p style={{ fontSize: '18px', lineHeight: '1.4' }}>
          <Link href="/" style={textLinkStyle}>
            Go to homepage
          </Link>
        </p>
      </Layout>
    </Suspense>
  )
}
