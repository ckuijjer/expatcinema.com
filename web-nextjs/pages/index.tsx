import * as React from 'react'

import App from '../components/App'
import Layout from '../components/Layout'
// import Seo from '../components/Seo'
import { getScreenings } from '../components/getScreenings'

export const getStaticProps = async () => {
  const screenings = await getScreenings()

  return {
    props: {
      data: screenings,
    },
  }
}

const IndexPage = ({ data }) => {
  return (
    <Layout>
      {/* <Seo title="Home" /> */}
      <App screenings={data} showCity />
    </Layout>
  )
}

export default IndexPage
