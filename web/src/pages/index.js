import * as React from 'react'
import { graphql } from 'gatsby'

import App from '../components/App'
import Layout from '../components/Layout'
import Seo from '../components/Seo'

const IndexPage = ({ data }) => {
  const screenings = data.allScreening.edges.map((edge) => edge.node)

  return (
    <Layout>
      <Seo title="Home" />
      <App screenings={screenings} />
    </Layout>
  )
}

export const query = graphql`
  query ScreeningQuery {
    allScreening {
      edges {
        node {
          date
          cinema {
            name
            city {
              name
            }
          }
          title
          url
        }
      }
    }
  }
`

export default IndexPage
