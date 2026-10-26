import { hasDate, toScreenings } from '../scrapers/lab1'

// The page of a film, such as /film/akira-4k-restoration/, as on 2026-10-26: its
// shows have <time datetime="2026-10-26T21:00:00+01:00">
const AKIRA_SHOW = {
  date: '2026-10-26T21:00:00+01:00',
  subtitles: 'Subtitles: ENG SUBS',
}

// The page of "Film Lovers Tuesday", a weekly discussion club, as on 2026-10-26
// (/film/filmclub-discussion-bioscoop-eindhoven/): an older layout with "di 27 okt"
// and "18:45" as text, so a show has no <time> and its date is empty
const FILM_LOVERS_TUESDAY_SHOW = {
  date: '',
  subtitles: 'FILMCLUB Subtitles: ENG SUBS',
}

describe('hasDate', () => {
  test('is a show with a time', () => {
    expect(hasDate(AKIRA_SHOW)).toBe(true)
  })

  test.each([
    ['empty', ''],
    ['spaces', '  '],
  ])('is not a show with a date that is %s', (_name, date) => {
    expect(hasDate({ date })).toBe(false)
  })
})

describe('toScreenings', () => {
  const page = {
    title: 'Akira (4K restoration)',
    url: 'https://www.lab-1.nl/film/akira-4k-restoration/',
    year: 1988,
  }

  test('makes a screening of a show with English subtitles', () => {
    const screenings = toScreenings({ ...page, shows: [AKIRA_SHOW] })

    expect(screenings).toHaveLength(1)
    expect(screenings[0]).toMatchObject({
      cinema: 'Lab-1',
      url: page.url,
      year: 1988,
    })
    expect(screenings[0].date.toISOString()).toBe('2026-10-26T20:00:00.000Z')
  })

  test('leaves out a show with Dutch subtitles', () => {
    expect(
      toScreenings({
        ...page,
        shows: [
          {
            date: '2026-10-27T10:00:00+01:00',
            subtitles: 'Subtitles: NL SUBS',
          },
        ],
      }),
    ).toEqual([])
  })

  test('leaves out a show without a date, so there is no invalid date', () => {
    expect(
      toScreenings({
        title: 'FILM LOVERS TUESDAY',
        url: 'https://www.lab-1.nl/film/filmclub-discussion-bioscoop-eindhoven/',
        shows: [FILM_LOVERS_TUESDAY_SHOW],
      }),
    ).toEqual([])
  })

  test('keeps a show with a date next to one without', () => {
    expect(
      toScreenings({ ...page, shows: [FILM_LOVERS_TUESDAY_SHOW, AKIRA_SHOW] }),
    ).toHaveLength(1)
  })
})
