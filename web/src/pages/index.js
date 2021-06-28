import * as React from 'react'
import { graphql } from 'gatsby'

import App from '../components/App'
import Layout from '../components/Layout'
import Seo from '../components/Seo'

const IndexPage = ({ data }) => {
  const screenings = data.allScreeningsJson.edges.map((edge) => edge.node)

  return (
    <Layout>
      <Seo title="Home" />
      <App screenings={screenings} />
    </Layout>
  )
}

export const query = graphql`
  query ScreeningsQuery {
    allScreeningsJson {
      edges {
        node {
          date
          cinema
          title
          url
        }
      }
    }
  }
`

export default IndexPage
