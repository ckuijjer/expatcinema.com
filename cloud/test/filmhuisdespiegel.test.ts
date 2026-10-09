import {
  cleanTitle,
  extractReleaseYear,
  findSubtitles,
  hasEnglishSubtitles,
  isFilmhuisDeSpiegel,
  parseDate,
} from '../scrapers/filmhuisdespiegel'

// Strings as found on https://www.plt.nl/filmhuisdespiegel (2026-10-03)
describe('filmhuisdespiegel', () => {
  describe('parseDate', () => {
    test('reads the date and time of a tile, in summer time', () => {
      expect(parseDate('Film - Zo 04 okt. 2026 - 14:30 uur')).toEqual(
        new Date('2026-10-04T12:30:00Z'),
      )
    })

    test('uses winter time after the clocks change on 25 October 2026', () => {
      expect(parseDate('Film - Di 27 okt. 2026 - 20:00 uur')).toEqual(
        new Date('2026-10-27T19:00:00Z'),
      )
    })

    test('takes the year from the text', () => {
      expect(parseDate('Film - Za 02 jan. 2027 - 20:15 uur')).toEqual(
        new Date('2027-01-02T19:15:00Z'),
      )
    })

    test.each([
      ['mrt.', 3],
      ['mei', 5],
    ])('month %p', (month, number) => {
      const date = parseDate(`Film - Vr 06 ${month} 2026 - 20:00 uur`)

      expect(date?.getUTCMonth()).toBe(number - 1)
    })

    test('returns undefined without a date, or with an impossible one', () => {
      expect(parseDate('Film')).toBeUndefined()
      expect(parseDate('Film - Vr 31 nov. 2026 - 20:00 uur')).toBeUndefined()
    })
  })

  describe('isFilmhuisDeSpiegel', () => {
    test.each([
      'Filmhuis de Spiegel',
      'Filmhuis De Spiegel',
      'Filmhuis de Spiegel i.s.m. Netwerk Palliatieve Zorg',
    ])('accepts %p', (organiser) => {
      expect(isFilmhuisDeSpiegel(organiser)).toBe(true)
    })

    test.each(['Theater Heerlen', 'PLT', '', 'Het Filmhuis de Spiegel'])(
      'rejects %p',
      (organiser) => {
        expect(isFilmhuisDeSpiegel(organiser)).toBe(false)
      },
    )
  })

  describe('subtitles', () => {
    test('finds the subtitles part of the language line', () => {
      expect(
        findSubtitles([
          'Frankrijk, 2026 | 115 minutenRegie: Camille Cottin',
          'Frans gesproken | Nederlands ondertiteld',
        ]),
      ).toBe('Nederlands ondertiteld')
    })

    test('has no subtitles when the line only says what is spoken', () => {
      expect(
        findSubtitles([
          'Nederland, 2026 | 88 minuten',
          'Nederlands, Frans, Engels gesproken',
        ]),
      ).toBeUndefined()
    })

    test.each([
      'Engels ondertiteld',
      'Nederlands en Engels ondertiteld',
      'English ondertiteld',
    ])('accepts %p', (subtitles) => {
      expect(hasEnglishSubtitles(subtitles)).toBe(true)
    })

    test.each(['Nederlands ondertiteld', 'Frans ondertiteld', '', undefined])(
      'rejects %p',
      (subtitles) => {
        expect(hasEnglishSubtitles(subtitles)).toBe(false)
      },
    )

    test('does not take a spoken language for subtitles', () => {
      // "Engels gesproken | Nederlands ondertiteld"
      expect(
        hasEnglishSubtitles(
          findSubtitles(['Engels gesproken | Nederlands ondertiteld']),
        ),
      ).toBe(false)
    })

    test('finds English subtitles in a full language line', () => {
      expect(
        hasEnglishSubtitles(
          findSubtitles(['Frans gesproken | Engels ondertiteld']),
        ),
      ).toBe(true)
    })
  })

  describe('extractReleaseYear', () => {
    test.each([
      [['Frankrijk, 2026 | 115 minutenRegie: Camille Cottin'], 2026],
      // a list of countries, then the year
      [
        [
          'Kroatië, Slowakije, Slovenië, Letland, Servië2025 | 83 minutenRegie: X',
        ],
        2025,
      ],
      [['Verenigd Koninkrijk2025 | 98 minuten'], 2025],
      [['Dari, Pasjtoe gesproken | Nederlands ondertiteld'], undefined],
      [['Het is 1985. The Cure staat in de hitlijsten'], undefined],
    ])('%p', (paragraphs, year) => {
      expect(extractReleaseYear(paragraphs)).toBe(year)
    })
  })

  describe('cleanTitle', () => {
    test.each([
      ['No Good Men + Q&A', 'No Good Men'],
      ['Coming Out Day: Jim Queen', 'Jim Queen'],
      ['Cinekid: Extraordinairy', 'Extraordinairy'],
      ['Construction Site | AFFR on Tour', 'Construction Site'],
      [
        'La Ricarda. Melody of a House | AFFR on Tour',
        'La Ricarda. Melody of a House',
      ],
      ['Hotel Lux | Cinema Today', 'Hotel Lux | Cinema Today'],
      ['The Cycle of Love', 'The Cycle of Love'],
      ['Toutes Directions', 'Toutes Directions'],
      ['Spira Mirabilis (2016)', 'Spira Mirabilis'],
    ])('%p -> %p', (input, expected) => {
      expect(cleanTitle(input)).toBe(expected)
    })
  })
})
