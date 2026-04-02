import type { Metadata } from 'next'
import { Suspense } from 'react'

import { App } from '../../../../../components/App'
import cinemas from '../../../../../data/cinema.json'
import { getCinema } from '../../../../../utils/getCinema'
import { getScreenings } from '../../../../../utils/getScreenings'

export const generateStaticParams = () =>
  cinemas.map((cinema) => ({
    city: cinema.city.toLowerCase(),
    cinema: cinema.slug,
  }))

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string; cinema: string }>
}): Promise<Metadata> {
  const { city, cinema } = await params
  const cinemaData = getCinema(cinema)
  const cinemaName = cinemaData?.name ?? cinema
  const cityName = cinemaData?.city ?? city

  return {
    title: `${cinemaName}, ${cityName} – Expat Cinema`,
    alternates: {
      canonical: `https://expatcinema.com/city/${city}/cinema/${cinema}`,
    },
  }
}

export default async function CinemaPage({
  params,
}: {
  params: Promise<{ city: string; cinema: string }>
}) {
  const { city, cinema } = await params
  const screenings = (await getScreenings()).filter(
    (screening) =>
      screening.cinema.city.name.toLowerCase() === city &&
      screening.cinema.slug === cinema,
  )

  return (
    <Suspense>
      <App screenings={screenings} currentCity={city} currentCinema={cinema} />
    </Suspense>
  )
}
