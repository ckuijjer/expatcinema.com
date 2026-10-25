import type { Screening } from './getScreenings'
import { withoutDoubleFeatureRepeats } from './groupAndSortScreenings'

const film = (movieId: string) => ({ movieId, title: movieId })

const screening = (movieId: string, doubleFeature?: string[]) =>
  ({
    movieId,
    title: movieId,
    doubleFeature: doubleFeature?.map(film),
  }) as Screening

describe('withoutDoubleFeatureRepeats', () => {
  test('keeps the screening of the first film of a double feature only', () => {
    const both = ['tmdb:224', 'tmdb:225']

    expect(
      withoutDoubleFeatureRepeats([
        screening('tmdb:225', both),
        screening('tmdb:224', both),
        screening('tmdb:1'),
      ]).map(({ movieId }) => movieId),
    ).toEqual(['tmdb:224', 'tmdb:1'])
  })
})
