import * as React from 'react'

import { App } from '../../../../components/App'
import { SEO } from '../../../../components/Seo'
import cinemas from '../../../../data/cinema.json'
import { getCinema } from '../../../../utils/getCinema'
import { Screening, getScreenings } from '../../../../utils/getScreenings'

export const getStaticPaths = () => {
  const paths = cinemas.map(
    (cinema) => `/city/${cinema.city.toLowerCase()}/cinema/${cinema.slug}`,
  )

  return {
    paths,
    fallback: false,
  }
}

export const getStaticProps = async ({
  params,
}: {
  params: { city: string; cinema: string }
}) => {
  const { city, cinema } = params
  const screenings = (await getScreenings()).filter(
    (screening) =>
      screening.cinema.city.name.toLowerCase() === city &&
      screening.cinema.slug === cinema,
  )
  const cinemaData = getCinema(cinema)
  const cinemaName = cinemaData?.name ?? cinema
  const cityName = cinemaData?.city ?? city

  return {
    props: {
      data: screenings,
      city,
      cinema,
      cinemaName,
      cityName,
    },
  }
}

const CinemaPage = ({
  data,
  city,
  cinema,
  cinemaName,
  cityName,
}: {
  data: Screening[]
  city: string
  cinema: string
  cinemaName: string
  cityName: string
}) => {
  return (
    <>
      <SEO
        title={`${cinemaName}, ${cityName}`}
        canonical={`https://expatcinema.com/city/${city}/cinema/${cinema}`}
      />
      <App screenings={data} currentCity={city} currentCinema={cinema} />
    </>
  )
}

export default CinemaPage
