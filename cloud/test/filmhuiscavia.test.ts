import {
  cleanTitle,
  extractReleaseYear,
  findMetadataLine,
  hasEnglishSubtitles,
  parseDate,
  parseMonthPageUrl,
  splitEntries,
  extractScreeningsFromMonthHtml,
} from '../scrapers/filmhuiscavia'

// Shaped like https://filmhuiscavia.nl/programma/oktober-2026 (2026-10-02)
const MONTH_PAGE = `
<h1>Oktober</h1>
<table><tr><td>Do. 1 |&nbsp;</td><td><a href="#cabra-marcado-morrer">Cabra</a></td></tr></table>
<hr id="cabra-marcado-morrer" />
<p><span><strong><span>&nbsp;Donderdag 1 oktober, 20:00&nbsp;</span></strong></span><br />DOCU</p>
<h3>Brazil Unfiltered</h3>
<h2>Cabra Marcado Para Morrer (Man Marked for Death, 20 Years Later)&nbsp;</h2>
<p><strong>Eduardo Coutinho | 1984 | Brazil | 119&rsquo; | EN subtitles&nbsp;</strong></p>
<hr id="menilmontant" />
<p><strong>&nbsp;Vrijdag 2 oktober, 21:00&nbsp;</strong></p>
<h2>M&eacute;nilmontant with live score by Kadavergraver</h2>
<p><strong>Dimitri Kirsanoff | 1926 | France | 38&rsquo; | silent, no language with live score</strong></p>
<hr id="objects-speak" />
<p><strong>&nbsp;Vrijdag 9 oktober, 20:30&nbsp;</strong></p>
<h2>Can you hear the objects speak?</h2>
<p>An evening about sound.</p>
<hr id="looking-back" />
<p><strong>&nbsp;Zaterdag 24 oktober, 20:30&nbsp;</strong></p>
<h2>Looking Back &ndash; by Porn Film Festival Amsterdam</h2>
<p><strong>Various | 107&rsquo; | EN subtitles</strong></p>
<hr />
<p>Footer</p>
`

describe('filmhuiscavia', () => {
  describe('parseMonthPageUrl', () => {
    test('reads month and year from a month page url', () => {
      expect(
        parseMonthPageUrl('https://filmhuiscavia.nl/programma/oktober-2026'),
      ).toEqual({ month: 10, year: 2026 })
      expect(
        parseMonthPageUrl('https://filmhuiscavia.nl/programma/januari-2027/'),
      ).toEqual({ month: 1, year: 2027 })
    })

    test.each([
      'https://filmhuiscavia.nl/programma/brazil-unfiltered',
      'https://filmhuiscavia.nl/programma/oktober',
      'https://filmhuiscavia.nl/info/contact',
      'https://example.com/programma/oktober-2026',
    ])('rejects %p', (url) => {
      expect(parseMonthPageUrl(url)).toBeUndefined()
    })
  })

  describe('parseDate', () => {
    const october = { month: 10, year: 2026 }

    test('combines the day and time of the entry with the year of the page', () => {
      expect(parseDate('Donderdag 1 oktober, 20:00 DOCU', october)).toEqual(
        new Date('2026-10-01T18:00:00Z'), // CEST
      )
    })

    test('uses winter time after the clocks change', () => {
      // summer time ends on Sunday 25 October 2026, so 31 October is UTC+1
      expect(parseDate('Zaterdag 31 oktober, 17:00', october)).toEqual(
        new Date('2026-10-31T16:00:00Z'),
      )
    })

    test('takes the year from the page, not from the text', () => {
      expect(
        parseDate('Zondag 4 oktober, 20:30 Azart | 2023', october),
      ).toEqual(new Date('2026-10-04T18:30:00Z'))
    })

    test('a December page can list January of the next year', () => {
      const december = { month: 12, year: 2026 }
      expect(parseDate('Zaterdag 2 januari, 20:30', december)).toEqual(
        new Date('2027-01-02T19:30:00Z'),
      )
    })

    test('a January page can list December of the previous year', () => {
      const january = { month: 1, year: 2027 }
      expect(parseDate('Donderdag 31 december, 20:00', january)).toEqual(
        new Date('2026-12-31T19:00:00Z'),
      )
    })

    test('returns undefined without a date, or with an impossible one', () => {
      expect(parseDate('Footer', october)).toBeUndefined()
      expect(parseDate('Vrijdag 31 november, 20:00', october)).toBeUndefined()
    })
  })

  describe('subtitles and year', () => {
    const line = 'Eduardo Coutinho | 1984 | Brazil | 119’ | EN subtitles'

    test('finds the metadata line among the bold texts of an entry', () => {
      expect(findMetadataLine(['Donderdag 1 oktober, 20:00', line, 'EN'])).toBe(
        line,
      )
      expect(findMetadataLine(['Donderdag 1 oktober, 20:00'])).toBeUndefined()
    })

    test.each([
      line,
      'Various | 107’ | EN subtitles',
      'X | 2020 | NL | 90’ | English subtitles',
    ])('accepts %p', (value) => {
      expect(hasEnglishSubtitles(value)).toBe(true)
    })

    test.each([
      'Dimitri Kirsanoff | 1926 | France | 38’ | silent, no language with live score',
      'Max Rothman | 2026 | USA | 110’ | no dialogue',
      'X | 2020 | NL | 90’ | NL subtitles',
      '',
      undefined,
    ])('rejects %p', (value) => {
      expect(hasEnglishSubtitles(value)).toBe(false)
    })

    test('reads the release year, when there is one', () => {
      expect(extractReleaseYear(line)).toBe(1984)
      expect(
        extractReleaseYear('Various | 107’ | EN subtitles'),
      ).toBeUndefined()
      expect(extractReleaseYear(undefined)).toBeUndefined()
    })
  })

  describe('cleanTitle', () => {
    test.each([
      ['Azart – Come Make Art + Q&A', 'Azart – Come Make Art'],
      ['Mãos à Terra + special event with Cityplot', 'Mãos À Terra'],
      ['Ménilmontant with live score by Kadavergraver', 'Ménilmontant'],
      ['Looking Back – by Porn Film Festival Amsterdam', 'Looking Back'],
      ['The Territory', 'The Territory'],
      ['Ex-Shaman (2018)', 'Ex-Shaman'],
    ])('%p -> %p', (input, expected) => {
      expect(cleanTitle(input)).toBe(expected)
    })
  })

  describe('splitEntries', () => {
    test('splits a month page into one entry per <hr>, with its anchor', () => {
      const entries = splitEntries(MONTH_PAGE)

      expect(entries.map(({ anchor }) => anchor)).toEqual([
        'cabra-marcado-morrer',
        'menilmontant',
        'objects-speak',
        'looking-back',
        undefined, // the <hr /> in front of the footer
      ])
      expect(entries[0].html).toContain('Donderdag 1 oktober, 20:00')
      expect(entries[0].html).toContain('<h2>Cabra Marcado')
      expect(entries[0].html).not.toContain('Vrijdag 2 oktober')
    })

    test('has no entries without a separator', () => {
      expect(splitEntries('<h1>Oktober</h1><p>Nothing yet</p>')).toEqual([])
    })
  })

  describe('extractScreeningsFromMonthHtml', () => {
    const url = 'https://filmhuiscavia.nl/programma/oktober-2026'

    test('keeps the entries with English subtitles, and links to their entry', async () => {
      expect(await extractScreeningsFromMonthHtml(MONTH_PAGE, url)).toEqual([
        {
          title:
            'Cabra Marcado Para Morrer (Man Marked for Death, 20 Years Later)',
          year: 1984,
          url: `${url}#cabra-marcado-morrer`,
          cinema: 'Filmhuis Cavia',
          date: new Date('2026-10-01T18:00:00Z'),
        },
        {
          title: 'Looking Back',
          year: undefined,
          url: `${url}#looking-back`,
          cinema: 'Filmhuis Cavia',
          date: new Date('2026-10-24T18:30:00Z'),
        },
      ])
    })

    test('rejects a url that is not a month page', async () => {
      await expect(
        extractScreeningsFromMonthHtml(MONTH_PAGE, 'https://filmhuiscavia.nl/'),
      ).rejects.toThrow('Not a Filmhuis Cavia month page')
    })
  })
})
