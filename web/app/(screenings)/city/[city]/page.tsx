import type { Metadata } from 'next'
import { Suspense } from 'react'

import { App } from '../../../../components/App'
import cities from '../../../../data/city.json'
import { getCity } from '../../../../utils/getCity'
import { getScreenings } from '../../../../utils/getScreenings'
import {
  buildCityDescription,
  buildCityIntro,
} from '../../../../utils/seoMetadata'
import { getCanonicalUrl } from '../../../../utils/siteUrl'

export const generateStaticParams = () =>
  cities.map((city) => ({ city: city.slug }))

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>
}): Promise<Metadata> {
  const { city } = await params
  const cityName = getCity(city)?.name ?? city
  const screenings = (await getScreenings()).filter(
    (screening) => screening.cinema.city.slug === city,
  )

  return {
    title: `English-Subtitled Movies in ${cityName} – Expat Cinema`,
    description: buildCityDescription(cityName, screenings),
    alternates: { canonical: getCanonicalUrl(`/city/${city}`) },
  }
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ city: string }>
}) {
  const { city } = await params
  const cityName = getCity(city)?.name ?? city
  const screenings = (await getScreenings()).filter(
    (screening) => screening.cinema.city.slug === city,
  )

  return (
    <Suspense>
      <App
        screenings={screenings}
        currentCity={city}
        title={`English-Subtitled Movies in ${cityName}`}
        intro={buildCityIntro(cityName, screenings)}
      />
    </Suspense>
  )
}
