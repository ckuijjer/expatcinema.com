import {
  candidateYearAgrees,
  compactTitle,
  getBracketTitleVariants,
  getMovieSortTitle,
  getMovieId,
  getTitleSearchVariants,
  normalizeMovieTitleForLookup,
  scoreCandidate,
  scoreCandidateWithYearHints,
  selectCandidateWithPopularityTieBreak,
  stripTitleNoise,
} from '../metadata/titleResolver'

describe('titleResolver', () => {
  test('normalizes titles for stable lookups', () => {
    expect(normalizeMovieTitleForLookup('Amélie  ')).toBe('amelie')
  })

  test('strips common presentation noise from titles', () => {
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

  test('strips part markers and double-bill suffixes to a single canonical title', () => {
    expect(stripTitleNoise('1900 (Novecento) – Part One')).toBe(
      '1900 (Novecento)',
    )
    expect(stripTitleNoise('Kaiba (Part 1)')).toBe('Kaiba')
    expect(stripTitleNoise('Trenque Lauquen Part I & Part II')).toBe(
      'Trenque Lauquen',
    )
    expect(stripTitleNoise('Uncle Mustache (1970) & Journey')).toBe(
      'Uncle Mustache & Journey',
    )
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

  test('produces canonical search variants for part-based titles', () => {
    expect(getTitleSearchVariants('Trenque Lauquen Part I & Part II')).toEqual([
      'Trenque Lauquen Part I & Part II',
      'Trenque Lauquen',
      'trenque lauquen part i & part ii',
      'trenque lauquen',
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

  test('uses popularity to break ties between equally strong candidates', () => {
    const selected = selectCandidateWithPopularityTieBreak([
      {
        candidate: { id: 399031, popularity: 1.8699 },
        confidence: 1,
      },
      {
        candidate: { id: 399219, popularity: 0.0306 },
        confidence: 1,
      },
    ])

    expect(selected?.winner?.candidate.id).toBe(399031)
    expect(selected?.hasPopularityTieBreak).toBe(true)
  })

  describe('titles that only differ in spelling', () => {
    const goodByeLenin = {
      title: 'Good Bye, Lenin!',
      releaseDate: '2003-02-13',
    }

    test('compacts to letters and digits, "&" as "and", without a leading article', () => {
      expect(compactTitle('Goodbye, Lenin!')).toBe(
        compactTitle('Good Bye, Lenin!'),
      )
      expect(compactTitle('Brief History of Love')).toBe(
        compactTitle('A Brief History of Love'),
      )
      expect(compactTitle('Kreator Hate and Hope')).toBe(
        compactTitle('Kreator - Hate & Hope'),
      )
      expect(compactTitle('Molly Vs the Machines')).toBe(
        compactTitle('Molly vs. THE MACHINES'),
      )
    })

    test('scores an identical spelling as a match when the year agrees', () => {
      expect(
        scoreCandidateWithYearHints('Goodbye, Lenin!', goodByeLenin, [2003]),
      ).toBeGreaterThanOrEqual(0.9)
      expect(
        scoreCandidateWithYearHints('Goodbye, Lenin!', goodByeLenin, [2004]),
      ).toBeGreaterThanOrEqual(0.9)
    })

    test('needs a year that agrees', () => {
      expect(
        scoreCandidateWithYearHints('Goodbye, Lenin!', goodByeLenin),
      ).toBeLessThan(0.9)
      expect(
        scoreCandidateWithYearHints('Goodbye, Lenin!', goodByeLenin, [1996]),
      ).toBeLessThan(0.9)
    })

    test('does not make a different title similar', () => {
      expect(
        scoreCandidateWithYearHints(
          'Goodbye, Lenin!',
          { title: 'Good Night, and Good Luck', releaseDate: '2003-01-01' },
          [2003],
        ),
      ).toBeLessThan(0.9)
    })
  })

  describe('a title that is one part of a title with a subtitle', () => {
    const stateOfTheNation = {
      title: 'State of the Nation',
      originalTitle: 'Zur Lage: Österreich in sechs Kapiteln',
      releaseDate: '2002-01-01',
    }

    test('matches the part before the colon when the year agrees', () => {
      expect(
        scoreCandidateWithYearHints('Zur Lage', stateOfTheNation, [2002]),
      ).toBeGreaterThanOrEqual(0.9)
    })

    test('matches the part after the colon, a year off', () => {
      expect(
        scoreCandidateWithYearHints(
          'Below the Clouds',
          { title: 'Pompei: Below the Clouds', releaseDate: '2025-01-01' },
          [2026],
        ),
      ).toBeGreaterThanOrEqual(0.9)
    })

    test('needs the year to agree', () => {
      expect(
        scoreCandidateWithYearHints('Zur Lage', stateOfTheNation),
      ).toBeLessThan(0.9)
      expect(
        scoreCandidateWithYearHints('Zur Lage', stateOfTheNation, [2010]),
      ).toBeLessThan(0.9)
    })
  })

  describe('a title with an alternative title in brackets', () => {
    test('has the parts as search variants', () => {
      expect(getBracketTitleVariants('Het Offer (the Sacrifice)')).toEqual([
        'Het Offer',
        'the Sacrifice',
      ])
      expect(
        getBracketTitleVariants(
          'Cabra Marcado Para Morrer (Man Marked for Death, 20 Years Later)',
        ),
      ).toEqual([
        'Cabra Marcado Para Morrer',
        'Man Marked for Death, 20 Years Later',
        'Man Marked for Death',
      ])
      expect(getTitleSearchVariants('Het Offer (the Sacrifice)')).toContain(
        'the Sacrifice',
      )
    })

    test('ignores a year and markers in brackets', () => {
      expect(getBracketTitleVariants('Der Held (2025)')).toEqual([])
      expect(getBracketTitleVariants('Fjord (Eng Subs)')).toEqual([])
      expect(getBracketTitleVariants('Akira (4K Restoration)')).toEqual([])
      expect(getBracketTitleVariants('Heat')).toEqual([])
    })

    test('scores the film by the title in brackets', () => {
      expect(
        scoreCandidateWithYearHints(
          'Het Offer (the Sacrifice)',
          {
            title: 'The Sacrifice',
            originalTitle: 'Offret',
            releaseDate: '1986-05-09',
          },
          [1986],
        ),
      ).toBeGreaterThanOrEqual(0.9)
    })
  })

  test('strips Eng Subs and Q&A markers', () => {
    expect(stripTitleNoise('Eng Sub Palestine 36')).toBe('Palestine 36')
    expect(stripTitleNoise('Waar Is Mijn Libido? + Q&a Regisseur')).toBe(
      'Waar Is Mijn Libido?',
    )
  })

  describe('candidates with the same score', () => {
    test('prefers the one whose release year agrees over one without a release date', () => {
      const selected = selectCandidateWithPopularityTieBreak([
        { candidate: { id: 324455, popularity: 1.5 }, confidence: 0.925 },
        {
          candidate: { id: 519121, popularity: 0.9 },
          confidence: 0.95,
          yearAgrees: true,
        },
      ])

      expect(selected?.winner.candidate.id).toBe(519121)
      expect(selected?.hasPopularityTieBreak).toBe(true)
    })

    test('uses popularity among those whose year agrees', () => {
      const selected = selectCandidateWithPopularityTieBreak([
        {
          candidate: { id: 1, popularity: 1 },
          confidence: 1,
          yearAgrees: true,
        },
        {
          candidate: { id: 2, popularity: 5 },
          confidence: 1,
          yearAgrees: true,
        },
        {
          candidate: { id: 3, popularity: 9 },
          confidence: 1,
          yearAgrees: false,
        },
      ])

      expect(selected?.winner.candidate.id).toBe(2)
    })

    test('is unchanged when none agrees', () => {
      const selected = selectCandidateWithPopularityTieBreak([
        {
          candidate: { id: 1, popularity: 1 },
          confidence: 1,
          yearAgrees: false,
        },
        {
          candidate: { id: 2, popularity: 5 },
          confidence: 1,
          yearAgrees: false,
        },
      ])

      expect(selected?.winner.candidate.id).toBe(2)
    })
  })

  test('knows when a release year agrees with a year hint', () => {
    expect(
      candidateYearAgrees('X', { releaseDate: '2019-04-03' }, [2018]),
    ).toBe(true)
    expect(
      candidateYearAgrees('X', { releaseDate: '2019-04-03' }, [2017]),
    ).toBe(false)
    expect(candidateYearAgrees('X', { releaseDate: '' }, [2019])).toBe(false)
    expect(candidateYearAgrees('X', { releaseDate: '2019-04-03' })).toBe(false)
  })
})
