import * as React from 'react'
import { graphql } from 'gatsby'
import * as Plot from '@observablehq/plot'

// import App from '../components/App'
import Layout from '../components/Layout'
import Seo from '../components/Seo'

const AnalyticsPage = ({ data }) => {
  const analytics = data.allAnalytics.edges.map((edge) => edge.node)

  const points = analytics.flatMap(({ createdAt, ...rest }) =>
    Object.entries(rest).map(([scraper, count]) => ({
      createdAt,
      count,
      scraper,
    })),
  )

  const svg = Plot.plot({
    marks: [Plot.line(points, { x: 'createdAt', y: 'count', z: 'scraper' })],
  })

  return (
    <Layout>
      <Seo title="Analytics" />
      <div
        dangerouslySetInnerHTML={{
          __html: svg.outerHTML,
        }}
      ></div>
    </Layout>
  )
}

export const query = graphql`
  query AnalyticsQuery {
    allAnalytics(sort: { fields: createdAt, order: ASC }) {
      edges {
        node {
          createdAt

          all
          bioscopenleiden
          cinecenter
          eyefilm
          filmhuisdenhaag
          filtered
          hartlooper
          kinorotterdam
          kriterion
          lab111
          lantarenvenster
          rialto
          springhaver
        }
      }
    }
  }
`

export default AnalyticsPage
