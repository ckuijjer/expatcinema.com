import * as React from 'react'

import App from '../../components/App'
import { getScreenings } from '../../components/getScreenings'
import cities from '../../data/city.json'
import Seo from '../../components/Seo'

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
      <Seo title="Home" />
      <App screenings={data} />
    </>
  )
}

export default CityPage
