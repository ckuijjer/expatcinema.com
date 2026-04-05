import {
  getMovieId,
  getTitleSearchVariants,
  normalizeMovieTitleForLookup,
  scoreCandidate,
  stripTitleNoise,
} from '../metadata/titleResolver'

describe('titleResolver', () => {
  test('normalizes titles for stable lookups', () => {
    expect(normalizeMovieTitleForLookup("Amélie  ")).toBe('amelie')
  })

  test('strips common cinema noise from titles', () => {
    expect(stripTitleNoise('Amelie (2001) 4K Restoration')).toBe('Amelie')
    expect(stripTitleNoise("The Third Man - 75th Anniversary")).toBe(
      'The Third Man',
    )
  })

  test('produces multiple search variants', () => {
    expect(getTitleSearchVariants('Amelie (2001) 4K Restoration')).toEqual([
      'Amelie (2001) 4K Restoration',
      'Amelie',
      'amelie (2001) 4k restoration',
      'amelie',
    ])
  })

  test('builds stable internal movie ids', () => {
    expect(getMovieId(123)).toBe('tmdb:123')
  })

  test('scores localized and alternate titles strongly', () => {
    const directScore = scoreCandidate('Amelie', {
      title: 'Amelie',
      originalTitle: "Le Fabuleux Destin d'Amelie Poulain",
      releaseDate: '2001-04-25',
    })

    const alternateTitleScore = scoreCandidate("Le Fabuleux Destin d'Amelie Poulain", {
      title: 'Amelie',
      originalTitle: "Le Fabuleux Destin d'Amelie Poulain",
      releaseDate: '2001-04-25',
    })

    const wrongMovieScore = scoreCandidate('Amelie', {
      title: 'Alien',
      originalTitle: 'Alien',
      releaseDate: '1979-05-25',
    })

    expect(directScore).toBeGreaterThan(0.9)
    expect(alternateTitleScore).toBeGreaterThan(0.9)
    expect(wrongMovieScore).toBeLessThan(0.6)
  })
})
