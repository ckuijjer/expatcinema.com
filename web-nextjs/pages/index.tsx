import * as React from 'react'

import App from '../components/App'
import Layout from '../components/Layout'
// import Seo from '../components/Seo'
import { getScreenings } from '../components/getScreenings'
import Seo from '../components/Seo'

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
    <>
      <Seo title="Home" />
      <App screenings={data} showCity />
    </>
  )
}

export default IndexPage
