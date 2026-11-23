import {
  cleanTitle,
  extractDescriptions,
  extractReleaseYear,
  extractScreeningsFromEvent,
  extractShowtimes,
  getLastAgendaPage,
  hasEnglishSubtitles,
  isEventUrl,
} from '../scrapers/delievevrouw'

// Markup as on https://lievevrouw.nl/agenda/<event> (the tags and table are
// those of the English-subtitled Flophouse America page, the JSON-LD blocks
// those of a live page, one per showtime)
const eventHtml = ({
  title = 'Flophouse America',
  tags = ['Movies that Matter', 'Engels ondertiteld'],
  land = 'Noorwegen, Nederland, 2025',
  startDates = ['2026-10-03T16:25:00.0000000', '2026-10-04T11:25:00.0000000'],
  description = 'Een documentaire over de bouwers van een hotel.',
} = {}) => `
<html><head>
${startDates
  .map(
    (startDate) => `<script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "ScreeningEvent",
        "name": "${title}",
        "url": "https://lievevrouw.nl/agenda/flophouse-america",
        "startDate": "${startDate}",
        "endDate": "2026-10-03T17:58:00.0000000",
        "description": "${description}"
    }
</script>`,
  )
  .join('\n')}
</head><body>
  <ul class="breadcrumb no-p"><li><a href="/">Home</a></li><li>${title}</li></ul>
  <ul class="event-tags flex no-bullets ">
    ${tags.map((tag) => `<li class="mr-10">${tag}</li>`).join('\n')}
  </ul>
  <div class="text align-left col-7-12 sm-col-1-1 no-p"><h1>${title}</h1></div>
  <table class="event-table">
    <tr><th>Genre</th><td>documentaire</td></tr>
    <tr><th>Taal</th><td>Engels</td></tr>
    <tr><th>Duur</th><td>80 minuten</td></tr>
    <tr><th>Land</th><td>${land}</td></tr>
  </table>
</body></html>`

describe('delievevrouw', () => {
  describe('isEventUrl', () => {
    test.each([
      'https://lievevrouw.nl/agenda/flophouse-america',
      'https://lievevrouw.nl/agenda/ctrl_dlv-possession',
      'https://lievevrouw.nl/agenda/naza/',
    ])('accepts %p', (url) => {
      expect(isEventUrl(url)).toBe(true)
    })

    test.each([
      'https://lievevrouw.nl/agenda/film',
      'https://lievevrouw.nl/agenda/nieuwe-filmreleases',
      'https://lievevrouw.nl/agenda',
      'https://lievevrouw.nl/agenda?page=2#agenda-overzicht',
      'https://lievevrouw.nl/agenda/naza/extra',
      'https://lievevrouw.nl/over-de-lieve-vrouw',
      'https://example.com/agenda/naza',
    ])('rejects %p', (url) => {
      expect(isEventUrl(url)).toBe(false)
    })
  })

  describe('getLastAgendaPage', () => {
    test('is the highest page the pagination links to', () => {
      expect(
        getLastAgendaPage([
          'https://lievevrouw.nl/agenda/film',
          'https://lievevrouw.nl/agenda?page=1#agenda-overzicht',
          'https://lievevrouw.nl/agenda?page=2#agenda-overzicht',
          'https://lievevrouw.nl/agenda?page=7#agenda-overzicht',
          'https://lievevrouw.nl/agenda?page=22#agenda-overzicht',
        ]),
      ).toBe(22)
    })

    test('is 1 without pagination', () => {
      expect(getLastAgendaPage(['https://lievevrouw.nl/agenda/film'])).toBe(1)
      expect(getLastAgendaPage([])).toBe(1)
    })
  })

  describe('hasEnglishSubtitles', () => {
    test.each([
      [['Movies that Matter', 'Engels ondertiteld'], true],
      [['engels ondertiteld'], true],
      [['Nederlands ondertiteld'], false],
      [['toneel', 'ICOON'], false],
      [[], false],
    ])('%p', (tags, expected) => {
      expect(hasEnglishSubtitles(tags)).toBe(expected)
    })

    // the descriptions of the Joods Filmfestival Amersfoort events, 2026-11-23
    test.each([
      [
        'wordt gedwongen hun oude wonden onder ogen te zien.Let op: met Engelse ondertiteling.',
        true,
      ],
      [
        'Let op: Hongaars gesproken, Engelse ondertiteling.Meeslepend inside verslag',
        true,
      ],
      ['Let op: met Engelse ondertiteling', true],
      ['Shown with English subtitles.', true],
      ['Let op: geen Engelse ondertiteling', false],
      ['Zonder Engelse ondertiteling', false],
      ['Nederlandse ondertiteling', false],
      ['Een film in het Engels', false],
      ['', false],
    ])('description %p -> %p', (description, expected) => {
      expect(hasEnglishSubtitles([], [description])).toBe(expected)
    })
  })

  describe('extractDescriptions', () => {
    test('are the descriptions of the items of the JSON-LD blocks', () => {
      expect(
        extractDescriptions([
          '{"@type": "ScreeningEvent", "description": "Let op: met Engelse ondertiteling."}',
          '[{"@type": "TheaterEvent", "description": "Toneel"}, {"@type": "WebSite"}]',
          '{"@graph": [{"description": "Uit de graph"}]}',
          'not json',
        ]),
      ).toEqual([
        'Let op: met Engelse ondertiteling.',
        'Toneel',
        'Uit de graph',
      ])
    })
  })

  describe('extractReleaseYear', () => {
    test.each([
      ['Noorwegen, Nederland, 2025', 2025],
      ['IS, 2026', 2026],
      ['Nederland', undefined],
      ['Frankrijk, 2e helft 1990', undefined],
    ])('%p -> %p', (value, expected) => {
      expect(extractReleaseYear([{ label: 'Land', value }])).toBe(expected)
    })

    test('is undefined without a Land field', () => {
      expect(extractReleaseYear([{ label: 'Taal', value: 'Engels' }])).toBe(
        undefined,
      )
      expect(extractReleaseYear([])).toBe(undefined)
    })
  })

  describe('cleanTitle', () => {
    test.each([
      ['Bromens | ICOON', 'Bromens'],
      ['Bijna een leven | ICOON', 'Bijna Een Leven'],
      ['Banger dan ik (7+) | ICOON', 'Banger Dan Ik'],
      ['Alle kinderen stinken (6+)', 'Alle Kinderen Stinken'],
      ['Akira (re-release)', 'Akira'],
      ['CTRL_DLV: Possession', 'Possession'],
      ['Flophouse America (2025)', 'Flophouse America'],
      ['Carmen (must die)', 'Carmen (Must Die)'],
    ])('%p -> %p', (input, expected) => {
      expect(cleanTitle(input)).toBe(expected)
    })
  })

  describe('extractShowtimes', () => {
    test('reads startDate of a block, as Amsterdam time', () => {
      expect(
        extractShowtimes([
          '{"@type": "ScreeningEvent", "startDate": "2026-10-03T16:25:00.0000000"}',
        ]),
      ).toEqual([new Date('2026-10-03T14:25:00Z')]) // CEST
    })

    test('uses winter time after the clocks change', () => {
      expect(
        extractShowtimes([
          '{"@type": "ScreeningEvent", "startDate": "2026-10-31T20:00:00.0000000"}',
        ]),
      ).toEqual([new Date('2026-10-31T19:00:00Z')]) // CET since 25 October
    })

    test('reads a list and an @graph, and one block per showtime', () => {
      expect(
        extractShowtimes([
          '[{"startDate": "2026-10-03T16:25:00.0000000"}, {"name": "x"}]',
          '{"@graph": [{"@type": "WebSite"}, {"startDate": "2026-10-04T11:25:00.0000000"}]}',
          '{"@type": "TheaterEvent", "startDate": "2026-10-09T20:00:00.0000000"}',
        ]),
      ).toEqual([
        new Date('2026-10-03T14:25:00Z'),
        new Date('2026-10-04T09:25:00Z'),
        new Date('2026-10-09T18:00:00Z'),
      ])
    })

    test('skips what is not a showtime, instead of failing', () => {
      expect(
        extractShowtimes([
          'not json',
          'null',
          '{"@type": "MovieTheater"}',
          '{"startDate": "next friday"}',
          '{"startDate": 20261003}',
        ]),
      ).toEqual([])
    })
  })

  describe('extractScreeningsFromEvent', () => {
    const url = 'https://lievevrouw.nl/agenda/flophouse-america'

    test('gives a screening per showtime of an event with English subtitles', async () => {
      expect(await extractScreeningsFromEvent(eventHtml(), url)).toEqual([
        {
          title: 'Flophouse America',
          year: 2025,
          url,
          cinema: 'De Lieve Vrouw',
          date: new Date('2026-10-03T14:25:00Z'),
        },
        {
          title: 'Flophouse America',
          year: 2025,
          url,
          cinema: 'De Lieve Vrouw',
          date: new Date('2026-10-04T09:25:00Z'),
        },
      ])
    })

    test('has no year when the Land field has none', async () => {
      const [screening] = await extractScreeningsFromEvent(
        eventHtml({ land: 'Nederland' }),
        url,
      )

      expect(screening.year).toBeUndefined()
    })

    test('skips events without English subtitles', async () => {
      expect(
        await extractScreeningsFromEvent(
          eventHtml({ title: 'Bromens | ICOON', tags: ['toneel', 'ICOON'] }),
          url,
        ),
      ).toEqual([])
      expect(
        await extractScreeningsFromEvent(eventHtml({ tags: [] }), url),
      ).toEqual([])
    })

    test('takes English subtitles from the description when there is no tag', async () => {
      // a festival film as on https://lievevrouw.nl/agenda/all-about-the-levkoviches:
      // a first day without a time, then the showtime
      const screenings = await extractScreeningsFromEvent(
        eventHtml({
          title: 'All about the Levkoviches',
          tags: ['Joods Filmfestival Amersfoort'],
          land: 'Hongarije, 2026',
          startDates: [
            '2026-11-26T00:00:00.0000000',
            '2026-11-29T18:40:00.0000000',
          ],
          description: 'Let op: met Engelse ondertiteling.',
        }),
        url,
      )

      expect(screenings).toEqual([
        {
          title: 'All About the Levkoviches',
          year: 2026,
          url,
          cinema: 'De Lieve Vrouw',
          date: new Date('2026-11-29T17:40:00Z'),
        },
      ])
    })

    test('skips an event whose description does not mention English subtitles', async () => {
      expect(
        await extractScreeningsFromEvent(
          eventHtml({ tags: ['Joods Filmfestival Amersfoort'] }),
          url,
        ),
      ).toEqual([])
    })

    test('skips a showtime without a time', async () => {
      expect(
        await extractScreeningsFromEvent(
          eventHtml({ startDates: ['2026-11-26T00:00:00.0000000'] }),
          url,
        ),
      ).toEqual([])
    })

    test('skips an event with English subtitles but no showtimes', async () => {
      expect(
        await extractScreeningsFromEvent(eventHtml({ startDates: [] }), url),
      ).toEqual([])
    })
  })
})
