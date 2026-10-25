export type MatchStatus = 'matched' | 'manual' | 'ambiguous' | 'unmatched'

export type MatchMethod =
  | 'manual-override'
  | 'tmdb-search'
  | 'shared-label'
  | 'title-part'
  | 'double-feature'
  | 'director'
  | 'director-year'
  | 'unmatched'

export type TmdbVideo = {
  id?: string
  key?: string
  name?: string
  official?: boolean
  publishedAt?: string
  site?: string
  size?: number
  type?: string
}

export type TmdbVideos = {
  results?: TmdbVideo[]
}

export type TmdbMovie = {
  id: number
  adult?: boolean
  backdropPath?: string
  directors?: string[]
  genres?: string[]
  imdbId?: string
  mediaType?: string
  originalLanguage?: string
  originalTitle?: string
  overview?: string
  popularity?: number
  posterPath?: string
  releaseDate?: string
  runtime?: number
  title?: string
  video?: boolean
  videos?: TmdbVideos
  voteAverage?: number
  voteCount?: number
  alternativeTitles?: string[]
}

export type DirectorMatch = 'agree' | 'disagree' | 'unknown'

export type MetadataMatch = {
  status: MatchStatus
  method: MatchMethod
  confidence?: number
  matchedTitle?: string
  matchedOriginalTitle?: string
  matchedAlternativeTitle?: string
  matchedReleaseDate?: string
  // the film was picked from equally good candidates by its popularity
  popularityTieBreak?: boolean
  // whether the director of the screenings is one of the film's, when the
  // screenings have a director
  directorMatch?: DirectorMatch
  // for method 'shared-label' and 'title-part': the title that matched
  strippedTitle?: string
  // for method 'double-feature': the movieIds of the films that are shown, in
  // the order of the title
  doubleFeature?: string[]
  candidates?: Array<{
    movieId: string
    tmdbId: number
    title?: string
    originalTitle?: string
    releaseDate?: string
    popularity?: number
    confidence: number
    directorMatch?: DirectorMatch
  }>
}

export type Metadata = {
  query: string
  year?: number
  createdAt: string
  movieId?: string
  title?: string
  originalTitle?: string
  imdbId?: string
  tmdb?: TmdbMovie
  match: MetadataMatch
}
