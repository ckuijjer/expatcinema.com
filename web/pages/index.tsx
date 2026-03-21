import * as React from 'react'

import { App } from '../components/App'
import { SEO } from '../components/Seo'
import { Screening, getScreenings } from '../utils/getScreenings'

export const getStaticProps = async () => {
  const screenings = await getScreenings()

  return {
    props: {
      data: screenings,
    },
  }
}

const IndexPage = ({ data }: { data: Screening[] }) => {
  return (
    <>
      <SEO title="Home" />
      <App screenings={data} showCity />
    </>
  )
}

export default IndexPage
