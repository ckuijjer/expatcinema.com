import { extractYear } from '../scrapers/cinerama'

// Films as the Kinepolis API had them on 2026-10-07 (only the fields used)
describe('extractYear', () => {
  test.each([
    // new films: the release in the Netherlands is the year of the film
    [
      'Het Geheim van Hotel New York',
      '2026-10-20T00:00:00',
      { isActive: false },
      2026,
    ],
    [
      'Hunting Matthew Nichols',
      '2026-10-20T00:00:00',
      { isActive: false },
      2026,
    ],
    ['Franz', '2026-10-08T00:00:00', { isActive: false }, 2026],
    // an event that is not a re-release
    [
      'Naza',
      '2026-10-01T00:00:00',
      { isActive: true, shortName: 'Doc', name: 'Documentaire' },
      2026,
    ],
    // a year in the title is the year of the film
    ['Pride (2014)', '2026-11-10T00:00:00', { isActive: false }, 2014],
    [
      '12 Angry Men (1957)',
      '2026-09-01T00:00:00',
      { isActive: true, shortName: 'Reprise', name: 'Klassieker' },
      1957,
    ],
  ])('%s has the year %s', (title, releaseDate, event, expected) => {
    expect(
      extractYear({
        id: 'x',
        corporateId: '1',
        title,
        releaseDate,
        event,
        subtitles: [],
      }),
    ).toBe(expected)
  })

  test.each([
    // classics and re-releases have the date of the re-release, not the film's
    [
      'Akira (4K Restoration)',
      '2026-09-10T00:00:00',
      { isActive: true, shortName: 'Reprise', name: 'Klassieker' },
    ],
    [
      'Klassieker: A Nightmare on Elm Street',
      '2026-10-13T00:00:00',
      { isActive: true, shortName: 'Reprise', name: 'Klassieker' },
    ],
    [
      'Big Classic: Lawrence of Arabia',
      '2026-10-01T00:00:00',
      { isActive: true, shortName: 'CultNight', name: 'Big Classics' },
    ],
    [
      'The Texas Chain Saw Massacre (50th Anniversary)',
      '2026-10-29T00:00:00',
      { isActive: false },
    ],
    [
      'Donnie Darko (25th Anniversary)',
      '2026-11-19T00:00:00',
      { isActive: true, shortName: 'Reprise', name: 'Klassieker' },
    ],
    // no usable date
    ['Unknown', undefined, { isActive: false }],
    ['Unknown', '0001-01-01T00:00:00', { isActive: false }],
  ])('%s has no year', (title, releaseDate, event) => {
    expect(
      extractYear({
        id: 'x',
        corporateId: '1',
        title,
        releaseDate,
        event,
        subtitles: [],
      }),
    ).toBeUndefined()
  })
})
