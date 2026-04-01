import * as React from 'react'

import { App } from '../../../components/App'
import { SEO } from '../../../components/Seo'
import cities from '../../../data/city.json'
import { getCity } from '../../../utils/getCity'
import { Screening, getScreenings } from '../../../utils/getScreenings'

export const getStaticPaths = () => {
  const paths = cities.map((city) => `/city/${city.name.toLowerCase()}`)

  return {
    paths,
    fallback: false,
  }
}

export const getStaticProps = async ({
  params,
}: {
  params: { city: string }
}) => {
  const { city } = params
  const screenings = (await getScreenings()).filter(
    (screening) => screening.cinema.city.name.toLowerCase() === city,
  )
  const cityName = getCity(city)?.name ?? city

  return {
    props: {
      data: screenings,
      city,
      cityName,
    },
  }
}

const CityPage = ({
  data,
  city,
  cityName,
}: {
  data: Screening[]
  city: string
  cityName: string
}) => {
  return (
    <>
      <SEO
        title={cityName}
        canonical={`https://expatcinema.com/city/${city}`}
      />
      <App screenings={data} currentCity={city} />
    </>
  )
}

export default CityPage
