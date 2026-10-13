import type { Metadata } from 'next'
import { Suspense } from 'react'

import { css } from 'styled-system/css'

import { App } from '../../../../../../components/App'
import { CinemaTitle } from '../../../../../../components/CinemaTitle'
import { Layout } from '../../../../../../components/Layout'
import cinemas from '../../../../../../data/cinema.json'
import { getCinema } from '../../../../../../utils/getCinema'
import { getCity } from '../../../../../../utils/getCity'
import { getScreenings } from '../../../../../../utils/getScreenings'
import {
  buildCinemaDescription,
  buildSocialMetadata,
} from '../../../../../../utils/seoMetadata'
import { getCanonicalUrl } from '../../../../../../utils/siteUrl'

const titleWrapStyle = css({ marginTop: '28px', marginBottom: '16px' })

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

  const title = `Foreign movies with English subtitles at ${cinemaName}, ${cityName} – Expat Cinema`
  const description = buildCinemaDescription(cinemaName, cityName)

  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(`/city/${city}/cinema/${cinema}`),
    },
    ...buildSocialMetadata(title, description),
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
          <div className={titleWrapStyle}>
            <CinemaTitle cinema={cinemaData} />
          </div>
        </Layout>
      ) : null}
      <App screenings={screenings} currentCity={city} currentCinema={cinema} />
    </Suspense>
  )
}
