import * as React from 'react'
import { graphql } from 'gatsby'

import Layout from '../components/Layout'
import Seo from '../components/Seo'

// can't use @loadable/component to determine client vs server side rendering, as
// gatsby-plugin-loadable-components-ssr is used to render @loadable/component during ssr.
const LoadableAnalytics = React.lazy(() => import('../components/Analytics'))

const AnalyticsPage = ({ data }) => {
  const dataPoints = data.allAnalytics.edges.map((edge) => edge.node)
  const isSSR = typeof window === 'undefined'

  return (
    <Layout>
      <Seo title="Analytics" />
      <>
        {!isSSR && (
          <React.Suspense fallback={<div />}>
            <LoadableAnalytics points={dataPoints} />
          </React.Suspense>
        )}
      </>
    </Layout>
  )
}

export const query = graphql`
  query AnalyticsQuery {
    allAnalytics(sort: { fields: createdAt, order: ASC }) {
      edges {
        node {
          type
          createdAt
          scraper
          value
        }
      }
    }
  }
`

export default AnalyticsPage
