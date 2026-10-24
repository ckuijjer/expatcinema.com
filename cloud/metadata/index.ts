import searchMetadata from './searchMetadata'
import { normalizeMovieTitleForLookup } from './titleResolver'
import { Metadata } from './types'

type MetadataLookup = {
  title: string
  year?: number
  siblingYearHints?: number[]
  // what the cinemas say the director of the screenings is
  directors?: string[]
}

const getMetadata = async ({
  title,
  year,
  siblingYearHints,
  directors,
}: MetadataLookup): Promise<Metadata> => {
  const metadata = await searchMetadata(
    title,
    year,
    siblingYearHints,
    directors,
  )

  return {
    query: normalizeMovieTitleForLookup(title),
    year,
    createdAt: new Date().toISOString(),
    ...metadata,
  }
}

export default getMetadata
