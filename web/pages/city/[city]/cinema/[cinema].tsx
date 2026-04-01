import * as React from 'react'

import { App } from '../../../../components/App'
import { SEO } from '../../../../components/Seo'
import cinemas from '../../../../data/cinema.json'
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

  return {
    props: {
      data: screenings,
      city,
      cinema,
    },
  }
}

const CinemaPage = ({
  data,
  city,
  cinema,
}: {
  data: Screening[]
  city: string
  cinema: string
}) => {
  return (
    <>
      <SEO title="Home" />
      <App screenings={data} currentCity={city} currentCinema={cinema} />
    </>
  )
}

export default CinemaPage
