import * as React from 'react'
import fetch from 'cross-fetch'

import Layout from '../components/Layout'
import Seo from '../components/Seo'

// can't use @loadable/component to determine client vs server side rendering, as
// gatsby-plugin-loadable-components-ssr is used to render @loadable/component during ssr.
const LoadableAnalytics = React.lazy(() => import('../components/Analytics'))

const AnalyticsPage = ({ data }) => {
  const isSSR = typeof window === 'undefined'

  return (
    <Layout>
      {/* <Seo title="Analytics" /> */}
      <>
        {!isSSR && (
          <React.Suspense fallback={<div />}>
            <LoadableAnalytics points={data} />
          </React.Suspense>
        )}
      </>
    </Layout>
  )
}

export const getStaticProps = async () => {
  const url = `https://${process.env.APIGW_ID}.execute-api.eu-west-1.amazonaws.com/analytics`

  const response = await fetch(url)
  const data = await response.json()

  // TODO: sort?

  return {
    props: {
      data,
    },
  }
}

export default AnalyticsPage
