import { DateTime } from 'luxon'

import {
  cleanTitle,
  extractScreeningsFromMovieHtml,
  extractYear,
  hasEnglishSubtitles,
  parseDate,
  parseEnglishSubtitlesRule,
  parseSubtitleLanguages,
} from '../scrapers/debalie'

// Shaped like https://debalie.nl/cinema/club-heaven/ (2026-10-03): subtitles
// 'ENG' for every screening
const CLUB_HEAVEN = `
<h1>
  Club Heaven
</h1>
<div class="wp-block-vo-info-item"><dt class="wp-block-vo-info-item__subtitle">Regisseur</dt><dd class="wp-block-vo-info-item__inner"><span class="wp-block-vo-info-item__text">Jona Honer</span></dd></div>
<div class="wp-block-vo-info-item"><dt class="wp-block-vo-info-item__subtitle">Taal</dt><dd class="wp-block-vo-info-item__inner"><span class="wp-block-vo-info-item__text">Nederlands</span></dd></div>
<div class="wp-block-vo-info-item"><dt class="wp-block-vo-info-item__subtitle">Ondertitels</dt><dd class="wp-block-vo-info-item__inner"><span class="wp-block-vo-info-item__text">ENG</span></dd></div>
<div class="entry__content"><p>A film about a club.</p></div>
<div class="banner-bar__links" style="display: flex;" data-ticket-selector-day="20261003">
  <a href="https://debalie.nl/cinema/club-heaven/tickets/11839586" class="button button--tertiary button--ticket-icon banner-bar__link">
    17:45
  </a>
</div>
<div class="banner-bar__links" style="display: none;" data-ticket-selector-day="20261006">
  <a href="https://debalie.nl/cinema/club-heaven/tickets/11839587" class="button button--tertiary button--ticket-icon banner-bar__link">
    20:30
  </a>
</div>
`

// Dutch subtitles only, like "De Man Met De Glimlach" that was wrongly listed
const DUTCH_SUBTITLES = `
<h1>De Man Met De Glimlach</h1>
<div class="wp-block-vo-info-item"><dt class="wp-block-vo-info-item__subtitle">Ondertitels</dt><dd class="wp-block-vo-info-item__inner"><span class="wp-block-vo-info-item__text">NL</span></dd></div>
<div class="banner-bar__links" data-ticket-selector-day="20261003">
  <a href="https://debalie.nl/cinema/de-man-met-de-glimlach/tickets/1" class="banner-bar__link">18:45</a>
</div>
`

// Shaped like https://debalie.nl/cinema/amigo-secreto/: 'NL, ENG', and a
// sentence that says which screenings have the English subtitles.
// 2026-10-06 and 2026-10-13 are Tuesdays, 2026-10-10 is a Saturday.
const AMIGO_SECRETO = `
<h1>Amigo Secreto</h1>
<div class="wp-block-vo-info-item"><span class="wp-block-vo-info-item__subtitle">YEAR</span><div class="wp-block-vo-info-item__inner"><span class="wp-block-vo-info-item__text">2022</span></div></div>
<div class="wp-block-vo-info-item"><span class="wp-block-vo-info-item__subtitle">SUBTITLES</span><div class="wp-block-vo-info-item__inner"><span class="wp-block-vo-info-item__text">NL, ENG</span></div></div>
<div class="entry__content">
  <p class="wp-block-paragraph"><mark class="has-inline-color">The screening of Amigo Secreto will be with English subtitles on Tuesdays and Saturdays at 20:30. </mark></p>
</div>
<div class="banner-bar__links" data-ticket-selector-day="20261006"><a href="/cinema/amigo-secreto/tickets/1" class="banner-bar__link">20:30</a></div>
<div class="banner-bar__links" data-ticket-selector-day="20261007"><a href="/cinema/amigo-secreto/tickets/2" class="banner-bar__link">20:30</a></div>
<div class="banner-bar__links" data-ticket-selector-day="20261010"><a href="/cinema/amigo-secreto/tickets/3" class="banner-bar__link">11:00</a></div>
<div class="banner-bar__links" data-ticket-selector-day="20261010"><a href="/cinema/amigo-secreto/tickets/4" class="banner-bar__link">20:30</a></div>
<div class="banner-bar__links" data-ticket-selector-day="20261013"><a href="/cinema/amigo-secreto/tickets/5" class="banner-bar__link">18:00</a></div>
`

// An event that isn't on sale yet: no ticket links
const NO_TICKETS = `
<h1>CinéDialoog: Caméra d’Afrique</h1>
<div class="wp-block-vo-info-item"><dt class="wp-block-vo-info-item__subtitle">Ondertiteling</dt><dd class="wp-block-vo-info-item__inner"><span class="wp-block-vo-info-item__text">ENG</span></dd></div>
`

const URL = 'https://debalie.nl/cinema/club-heaven/'

describe('debalie', () => {
  describe('parseSubtitleLanguages', () => {
    test.each([
      ['NL', ['NL']],
      ['ENG', ['ENG']],
      ['NL, ENG', ['NL', 'ENG']],
      ['NL & ENG', ['NL', 'ENG']],
      ['eng', ['ENG']],
      ['', []],
    ])('%p', (value, expected) => {
      expect(parseSubtitleLanguages(value)).toEqual(expected)
    })
  })

  describe('parseEnglishSubtitlesRule', () => {
    test('reads weekdays and the showtime from the sentence', () => {
      expect(
        parseEnglishSubtitlesRule([
          'A film about something.',
          'The screening of Amigo Secreto will be with English subtitles on Tuesdays and Saturdays at 20:30. ',
        ]),
      ).toEqual({ weekdays: [2, 6], time: '20:30' })
    })

    test('the showtime is optional', () => {
      expect(
        parseEnglishSubtitlesRule(['With English subtitles on Fridays.']),
      ).toEqual({ weekdays: [5], time: undefined })
    })

    test.each([
      [
        [
          'This film will be shown with English subtitles on the following dates:',
        ],
      ],
      [['Dutch subtitles on Tuesdays']],
      [[]],
    ])('is not guessed from %p', (paragraphs) => {
      expect(parseEnglishSubtitlesRule(paragraphs)).toBeUndefined()
    })
  })

  describe('hasEnglishSubtitles', () => {
    const tuesday2030 = DateTime.fromISO('2026-10-06T20:30', {
      zone: 'Europe/Amsterdam',
    })
    const tuesday1800 = DateTime.fromISO('2026-10-06T18:00', {
      zone: 'Europe/Amsterdam',
    })
    const wednesday2030 = DateTime.fromISO('2026-10-07T20:30', {
      zone: 'Europe/Amsterdam',
    })
    const rule = { weekdays: [2, 6], time: '20:30' }

    test('ENG alone is for every screening', () => {
      expect(hasEnglishSubtitles(['ENG'], undefined, wednesday2030)).toBe(true)
    })

    test('NL alone never', () => {
      expect(hasEnglishSubtitles(['NL'], rule, tuesday2030)).toBe(false)
    })

    test('no subtitle information never', () => {
      expect(hasEnglishSubtitles([], rule, tuesday2030)).toBe(false)
    })

    test('NL, ENG only for the screenings the sentence names', () => {
      expect(hasEnglishSubtitles(['NL', 'ENG'], rule, tuesday2030)).toBe(true)
      expect(hasEnglishSubtitles(['NL', 'ENG'], rule, tuesday1800)).toBe(false)
      expect(hasEnglishSubtitles(['NL', 'ENG'], rule, wednesday2030)).toBe(
        false,
      )
    })

    test('NL, ENG without a sentence is not enough', () => {
      expect(hasEnglishSubtitles(['NL', 'ENG'], undefined, tuesday2030)).toBe(
        false,
      )
    })
  })

  describe('parseDate', () => {
    test('reads the day and time in Amsterdam time', () => {
      expect(parseDate('20261003', '17:45')?.toJSDate()).toEqual(
        new Date('2026-10-03T15:45:00Z'), // CEST
      )
    })

    test('uses winter time after the clocks change', () => {
      expect(parseDate('20261110', '20:30')?.toJSDate()).toEqual(
        new Date('2026-11-10T19:30:00Z'), // CET
      )
    })

    test('returns undefined for an unknown date or time', () => {
      expect(parseDate('20261301', '17:45')).toBeUndefined()
      expect(parseDate('20261003', 'Uitverkocht')).toBeUndefined()
      expect(parseDate('', '17:45')).toBeUndefined()
    })
  })

  describe('cleanTitle and extractYear', () => {
    test.each([
      ['Club Heaven', 'Club Heaven'],
      ['Amsterdam Polish Film Festival: Afterimage', 'Afterimage'],
      [
        'Amsterdam Polish Film Festival: The Promised Land',
        'The Promised Land',
      ],
      ['CinéDialoog: Iddu', 'Iddu'],
      ['Dune: Part Two', 'Dune: Part Two'], // other colons are part of the title
    ])('%p -> %p', (input, expected) => {
      expect(cleanTitle(input)).toBe(expected)
    })

    test('the year only comes from a year item', () => {
      expect(extractYear([{ label: 'jaar', value: '1983' }])).toBe(1983)
      expect(extractYear([{ label: 'YEAR', value: '2022' }])).toBe(2022)
      expect(extractYear([{ label: 'Speeltijd', value: '110′' }])).toBe(
        undefined,
      )
      expect(extractYear([{ label: 'jaar', value: 'ca. 1983' }])).toBe(
        undefined,
      )
    })
  })

  describe('extractScreeningsFromMovieHtml', () => {
    test('ENG subtitles: every screening, with the page as url', async () => {
      expect(await extractScreeningsFromMovieHtml(CLUB_HEAVEN, URL)).toEqual([
        {
          title: 'Club Heaven',
          year: undefined,
          url: URL,
          cinema: 'De Balie',
          date: new Date('2026-10-03T15:45:00Z'),
        },
        {
          title: 'Club Heaven',
          year: undefined,
          url: URL,
          cinema: 'De Balie',
          date: new Date('2026-10-06T18:30:00Z'),
        },
      ])
    })

    test('Dutch subtitles: nothing', async () => {
      expect(
        await extractScreeningsFromMovieHtml(DUTCH_SUBTITLES, URL),
      ).toEqual([])
    })

    test('NL, ENG: only the screenings the sentence names', async () => {
      const screenings = await extractScreeningsFromMovieHtml(
        AMIGO_SECRETO,
        'https://debalie.nl/cinema/amigo-secreto/',
      )

      expect(screenings.map(({ date }) => date)).toEqual([
        new Date('2026-10-06T18:30:00Z'), // Tuesday 20:30
        new Date('2026-10-10T18:30:00Z'), // Saturday 20:30
      ])
      expect(screenings.every(({ year }) => year === 2022)).toBe(true)
    })

    test('an event without ticket links has no screenings', async () => {
      expect(await extractScreeningsFromMovieHtml(NO_TICKETS, URL)).toEqual([])
    })
  })
})
