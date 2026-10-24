import { getMovieSlug, getMovieSortTitle } from './titleResolver'
import { Metadata } from './types'

// movies.json: one movie per movieId, from the lookups that matched a TMDB
// movie. Lookups of the same movie (another title or year) give the same
// movieId, the last one wins
export const buildMovies = (lookups: Metadata[]) =>
  Array.from(
    new Map(
      lookups
        .filter((metadata) => metadata.movieId && metadata.tmdb?.id)
        .map((metadata) => [
          metadata.movieId,
          {
            movieId: metadata.movieId,
            slug: getMovieSlug({
              title: metadata.title,
              query: metadata.query,
              tmdbId: metadata.tmdb?.id,
            }),
            tmdbId: metadata.tmdb?.id,
            imdbId: metadata.imdbId,
            title: metadata.title,
            sortTitle: getMovieSortTitle(metadata.title ?? ''),
            tmdb: {
              id: metadata.tmdb?.id,
              title: metadata.title,
              originalTitle: metadata.originalTitle,
              releaseDate: metadata.tmdb?.releaseDate,
              posterPath: metadata.tmdb?.posterPath,
              backdropPath: metadata.tmdb?.backdropPath,
              overview: metadata.tmdb?.overview,
              originalLanguage: metadata.tmdb?.originalLanguage,
              runtime: metadata.tmdb?.runtime,
              videos: metadata.tmdb?.videos,
              voteAverage: metadata.tmdb?.voteAverage,
              genres: metadata.tmdb?.genres ?? [],
              directors: metadata.tmdb?.directors ?? [],
            },
          },
        ]),
    ).values(),
  )
