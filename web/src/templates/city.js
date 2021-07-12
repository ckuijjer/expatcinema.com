import React from 'react'
import { graphql } from 'gatsby'

import App from '../components/App'
import Layout from '../components/Layout'
import Seo from '../components/Seo'

const CityTemplate = ({ data }) => {
  const { screenings, name } = data.allCity.nodes[0]

  return (
    <Layout>
      <Seo title={name} />
      <App screenings={screenings} showCity={false} />
    </Layout>
  )
}

export const query = graphql`
  query CityTemplateQuery($id: String) {
    allCity(filter: { id: { eq: $id } }) {
      nodes {
        name
        screenings {
          ...AppScreening
        }
      }
    }
  }
`

export default CityTemplate
