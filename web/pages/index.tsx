import * as React from 'react'

import { App } from '../components/App'
import { getScreenings } from '../utils/getScreenings'
import { SEO } from '../components/Seo'

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
      <SEO title="Home" />
      <App screenings={data} showCity />
    </>
  )
}

export default IndexPage
