import * as React from 'react'
import { graphql } from 'gatsby'

import App from '../components/App'
import Layout from '../components/Layout'
import Seo from '../components/Seo'

const IndexPage = ({ data }) => {
  const screenings = data.allScreening.edges.map((edge) => edge.node)

  return (
    <Layout>
      <Seo title="About" />
      <App screenings={screenings} showCity />
    </Layout>
  )
}

export const query = graphql`
  query ScreeningQuery {
    allScreening {
      edges {
        node {
          ...AppScreening
        }
      }
    }
  }
`

export default IndexPage
