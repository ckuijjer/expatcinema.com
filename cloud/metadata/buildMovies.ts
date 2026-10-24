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

type Movie = ReturnType<typeof buildMovies>[number]

export type SlugClash = {
  slug: string
  movies: { movieId?: string; title?: string; releaseDate?: string }[]
}

// Two movies can end up with the same slug (movies.json is looked up by it on
// the web). The movie with the lowest TMDB id keeps it, so the URL of a movie
// doesn't change from one run to the next, the others get their release year,
// or their TMDB id when that is missing or taken as well. A clash usually
// means a cinema gave a wrong year, so the caller should report it
export const makeSlugsUnique = (movies: Movie[]) => {
  const bySlug = Map.groupBy(movies, ({ slug }) => slug)
  const taken = new Set(bySlug.keys())
  const clashes: SlugClash[] = []
  const slugs = new Map<Movie, string>()

  for (const [slug, group] of bySlug) {
    if (group.length < 2) continue

    const byTmdbId = [...group].sort((a, b) => a.tmdbId! - b.tmdbId!)
    clashes.push({
      slug,
      movies: byTmdbId.map(({ movieId, title, tmdb }) => ({
        movieId,
        title,
        releaseDate: tmdb.releaseDate,
      })),
    })

    for (const movie of byTmdbId.slice(1)) {
      const year = movie.tmdb.releaseDate?.slice(0, 4)
      const candidates = [year && `${slug}-${year}`, `${slug}-${movie.tmdbId}`]
      const unique = candidates.find(
        (candidate): candidate is string =>
          Boolean(candidate) && !taken.has(candidate as string),
      )

      slugs.set(movie, unique ?? `${slug}-${movie.tmdbId}`)
      taken.add(slugs.get(movie)!)
    }
  }

  return {
    movies: movies.map((movie) => ({
      ...movie,
      slug: slugs.get(movie) ?? movie.slug,
    })),
    clashes,
  }
}
