import * as React from 'react'

import { App } from '../../components/App'
import { SEO } from '../../components/Seo'
import cities from '../../data/city.json'
import { getScreenings } from '../../utils/getScreenings'

export const getStaticPaths = () => {
  const paths = cities.map((city) => `/city/${city.name.toLowerCase()}`)

  return {
    paths,
    fallback: false,
  }
}

export const getStaticProps = async ({ params }) => {
  const { city } = params
  const screenings = (await getScreenings()).filter(
    (screening) => screening.cinema.city.name.toLowerCase() === city,
  )

  return {
    props: {
      data: screenings,
    },
  }
}

const CityPage = ({ data }) => {
  return (
    <>
      <SEO title="Home" />
      <App screenings={data} />
    </>
  )
}

export default CityPage
