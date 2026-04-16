import {
  getMovieSortTitle,
  getMovieId,
  getTitleSearchVariants,
  normalizeMovieTitleForLookup,
  scoreCandidate,
  scoreCandidateWithYearHints,
  stripTitleNoise,
} from '../metadata/titleResolver'

describe('titleResolver', () => {
  test('normalizes titles for stable lookups', () => {
    expect(normalizeMovieTitleForLookup('Amélie  ')).toBe('amelie')
  })

  test('strips common cinema noise from titles', () => {
    expect(stripTitleNoise('Amelie (2001) 4K Restoration')).toBe('Amelie')
    expect(stripTitleNoise('The Third Man - 75th Anniversary')).toBe(
      'The Third Man',
    )
  })

  test('strips parenthetical noise consistently across repeated calls', () => {
    expect(stripTitleNoise('Hard Boiled (4K Restoration)')).toBe('Hard Boiled')
    expect(stripTitleNoise('A Family (En Subs)')).toBe('A Family')
    expect(stripTitleNoise('Hard Boiled (4K Restoration)')).toBe('Hard Boiled')
  })

  test('builds sort titles without leading articles', () => {
    expect(getMovieSortTitle('The Matrix')).toBe('Matrix')
    expect(getMovieSortTitle('A Family')).toBe('Family')
    expect(getMovieSortTitle('An Education')).toBe('Education')
    expect(getMovieSortTitle('De Tweeling')).toBe('Tweeling')
    expect(getMovieSortTitle('Het Diner')).toBe('Diner')
    expect(getMovieSortTitle('Een Duitse Film')).toBe('Duitse Film')
    expect(getMovieSortTitle('Le Fabuleux Destin d’Amélie Poulain')).toBe(
      'Fabuleux Destin d’Amélie Poulain',
    )
    expect(getMovieSortTitle("L'engloutie")).toBe('engloutie')
    expect(getMovieSortTitle('El laberinto del fauno')).toBe(
      'laberinto del fauno',
    )
    expect(getMovieSortTitle('Los Olvidados')).toBe('Olvidados')
    expect(getMovieSortTitle('Der Himmel über Berlin')).toBe(
      'Himmel über Berlin',
    )
    expect(getMovieSortTitle('Das Boot')).toBe('Boot')
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

    const alternateTitleScore = scoreCandidate(
      "Le Fabuleux Destin d'Amelie Poulain",
      {
        title: 'Amelie',
        originalTitle: "Le Fabuleux Destin d'Amelie Poulain",
        releaseDate: '2001-04-25',
      },
    )

    const wrongMovieScore = scoreCandidate('Amelie', {
      title: 'Alien',
      originalTitle: 'Alien',
      releaseDate: '1979-05-25',
    })

    expect(directScore).toBeGreaterThan(0.9)
    expect(alternateTitleScore).toBeGreaterThan(0.9)
    expect(wrongMovieScore).toBeLessThan(0.6)
  })

  test('uses an explicit year hint when provided', () => {
    const preferredYearScore = scoreCandidate(
      'A Family',
      {
        title: 'A Family',
        releaseDate: '2026-04-02',
      },
      2026,
    )

    const wrongYearScore = scoreCandidate(
      'A Family',
      {
        title: 'A Family',
        releaseDate: '1970-04-02',
      },
      2026,
    )

    expect(preferredYearScore).toBeGreaterThan(wrongYearScore)
  })

  test('lets sibling year hints raise the score when the screening year is off', () => {
    const screeningYearScore = scoreCandidateWithYearHints(
      "Kiki's Delivery Service",
      {
        title: "Kiki's Delivery Service",
        releaseDate: '1989-11-23',
      },
      [2026],
    )

    const siblingYearScore = scoreCandidateWithYearHints(
      "Kiki's Delivery Service",
      {
        title: "Kiki's Delivery Service",
        releaseDate: '1989-11-23',
      },
      [2026, 1989],
    )

    expect(siblingYearScore).toBeGreaterThan(screeningYearScore)
    expect(siblingYearScore).toBeGreaterThan(0.9)
  })
})
