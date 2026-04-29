import type { Metadata } from 'next'
import { Suspense } from 'react'

import { App } from '../../../../../../components/App'
import { CinemaInfoBar } from '../../../../../../components/CinemaInfoBar'
import { Layout } from '../../../../../../components/Layout'
import cinemas from '../../../../../../data/cinema.json'
import { getCinema } from '../../../../../../utils/getCinema'
import { getCity } from '../../../../../../utils/getCity'
import { getScreenings } from '../../../../../../utils/getScreenings'
import { buildCinemaDescription } from '../../../../../../utils/seoMetadata'
import { getCanonicalUrl } from '../../../../../../utils/siteUrl'

export const generateStaticParams = () =>
  cinemas.map((cinema) => ({
    city: cinema.city,
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
  const cityName = getCity(cinemaData?.city ?? city)?.name ?? city

  return {
    title: `Foreign movies with English subtitles at ${cinemaName}, ${cityName} – Expat Cinema`,
    description: buildCinemaDescription(cinemaName, cityName),
    alternates: {
      canonical: getCanonicalUrl(`/city/${city}/cinema/${cinema}`),
    },
  }
}

export default async function CinemaPage({
  params,
}: {
  params: Promise<{ city: string; cinema: string }>
}) {
  const { city, cinema } = await params
  const cinemaData = getCinema(cinema)
  const screenings = (await getScreenings()).filter(
    (screening) =>
      screening.cinema.city.slug === city && screening.cinema.slug === cinema,
  )

  return (
    <Suspense>
      {cinemaData ? (
        <Layout>
          <CinemaInfoBar cinema={cinemaData} />
        </Layout>
      ) : null}
      <App screenings={screenings} currentCity={city} currentCinema={cinema} />
    </Suspense>
  )
}
