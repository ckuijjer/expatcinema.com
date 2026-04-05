import searchMetadata from './searchMetadata'
import { normalizeMovieTitleForLookup } from './titleResolver'
import { Metadata } from './types'

const getMetadata = async (title: string): Promise<Metadata> => {
  const metadata = await searchMetadata(title)

  return {
    query: normalizeMovieTitleForLookup(title),
    createdAt: new Date().toISOString(),
    ...metadata,
  }
}

export default getMetadata
