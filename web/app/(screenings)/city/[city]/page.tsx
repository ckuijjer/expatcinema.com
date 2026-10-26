import type { Metadata } from 'next'
import { Suspense } from 'react'

import { App } from '../../../../components/App'
import { JsonLd } from '../../../../components/JsonLd'
import cities from '../../../../data/city.json'
import { getCity } from '../../../../utils/getCity'
import { getScreenings } from '../../../../utils/getScreenings'
import { buildLocationBreadcrumbJsonLd } from '../../../../utils/jsonLd'
import {
  buildCityDescription,
  buildSocialMetadata,
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

  const title = `Foreign movies with English subtitles in ${cityName} – Expat Cinema`
  const description = buildCityDescription(cityName, screenings)

  return {
    title,
    description,
    alternates: { canonical: getCanonicalUrl(`/city/${city}`) },
    ...buildSocialMetadata(title, description),
  }
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ city: string }>
}) {
  const { city } = await params
  const screenings = (await getScreenings()).filter(
    (screening) => screening.cinema.city.slug === city,
  )

  return (
    <Suspense>
      <JsonLd
        data={buildLocationBreadcrumbJsonLd({
          slug: city,
          name: getCity(city)?.name ?? city,
        })}
      />
      <App screenings={screenings} currentCity={city} />
    </Suspense>
  )
}
