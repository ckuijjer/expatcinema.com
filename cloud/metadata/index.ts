import searchMetadata from './searchMetadata'
import { normalizeMovieTitleForLookup } from './titleResolver'
import { Metadata } from './types'

type MetadataLookup = {
  title: string
  year?: number
  siblingYearHints?: number[]
}

const getMetadata = async ({
  title,
  year,
  siblingYearHints,
}: MetadataLookup): Promise<Metadata> => {
  const metadata = await searchMetadata(title, year, siblingYearHints)

  return {
    query: normalizeMovieTitleForLookup(title),
    year,
    createdAt: new Date().toISOString(),
    ...metadata,
  }
}

export default getMetadata
