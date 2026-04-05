export type MatchStatus = 'matched' | 'manual' | 'ambiguous' | 'unmatched'

export type MatchMethod =
  | 'manual-override'
  | 'tmdb-search'
  | 'unmatched'

export type TmdbMovie = {
  id: number
  adult?: boolean
  backdropPath?: string
  genreIds?: number[]
  imdbId?: string
  mediaType?: string
  originalLanguage?: string
  originalTitle?: string
  overview?: string
  popularity?: number
  posterPath?: string
  releaseDate?: string
  title?: string
  video?: boolean
  voteAverage?: number
  voteCount?: number
  alternativeTitles?: string[]
}

export type MetadataMatch = {
  status: MatchStatus
  method: MatchMethod
  confidence?: number
  matchedTitle?: string
  matchedOriginalTitle?: string
  matchedAlternativeTitle?: string
  matchedReleaseDate?: string
  candidates?: Array<{
    movieId: string
    tmdbId: number
    title?: string
    originalTitle?: string
    releaseDate?: string
    confidence: number
  }>
}

export type Metadata = {
  query: string
  createdAt: string
  movieId?: string
  title?: string
  originalTitle?: string
  imdbId?: string
  tmdb?: TmdbMovie
  match: MetadataMatch
}
