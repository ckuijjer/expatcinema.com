import { cleanTitle, findSeriesLabels } from '../scrapers/filmhuisdenhaag'

// Titles as the programme API had them on 2026-10-06
const programme = [
  'Lamb - Gather Round Folks - EN subs',
  'The Wailing - Gather Round Folks - EN subs',
  'Candyman - Gather Round Folks',
  'Hold Onto Me - LIFF - EN subs',
  'Mouse - LIFF',
  'Human Traffic - No Lonely Dancefloors - EN subs met inleiding',
  'Dirty Dancing - No Lonely Dance Floors',
  'Kareltje Kat - Cinemini',
  'Samen - Cinemini',
  'Coward - First Pick - EN subs',
  'Les Parapluies de Cherbourg - Jacques Demy',
  'Youri - met Q&A',
  'Children Who Chase Lost Voices - Late Night Anime',
  'Ellie de Olifant – De Grote Reis - De Betovering',
  'Olivia - De Betovering',
  'Mission: Impossible - Fallout',
  'Spider-Man',
]

const seriesLabels = findSeriesLabels(programme)

describe('findSeriesLabels', () => {
  test('finds the suffixes that more than one film has, ignoring case and spacing', () => {
    expect([...seriesLabels].sort()).toEqual([
      'cinemini',
      'debetovering',
      'ensubs',
      'gatherroundfolks',
      'liff',
      'nolonelydancefloors',
    ])
  })

  test('counts a film once, however many times it is listed', () => {
    expect(
      findSeriesLabels([
        'Lamb - Gather Round Folks',
        'Lamb - Gather Round Folks',
      ]),
    ).toEqual(new Set())
  })
})

describe('cleanTitle', () => {
  test.each([
    // a series that more than one film has, stacked with a format label
    ['Lamb - Gather Round Folks - EN subs', 'Lamb'],
    ['Hold Onto Me - LIFF - EN subs', 'Hold Onto Me'],
    [
      'Human Traffic - No Lonely Dancefloors - EN subs met inleiding',
      'Human Traffic',
    ],
    ['Dirty Dancing - No Lonely Dance Floors', 'Dirty Dancing'],
    // a festival, and a known series that only one film has
    [
      'True to Our Inner Daemon - Festival Dag in de Branding - EN subs - met Q&A',
      'True to Our Inner Daemon',
    ],
    ['Joe Speedboot - No Limits Festival', 'Joe Speedboot'],
    ['Coward - First Pick - EN subs', 'Coward'],
    // a format label
    ['Youri - met Q&A', 'Youri'],
    ['Histoires Parallèles - EN subs', 'Histoires Parallèles'],
    // a known series that is not repeated in this programme
    [
      'Children Who Chase Lost Voices - Late Night Anime',
      'Children Who Chase Lost Voices',
    ],
    ['Akira (4K Restoration) - Late Night Anime', 'Akira'],
    ['Akira (Re-Release)', 'Akira'],
  ])('removes the suffixes of %s', (title, expected) => {
    expect(cleanTitle(title, seriesLabels)).toBe(expected)
  })

  test.each([
    // the subtitle of one film, which the TMDB match needs
    ['Mission: Impossible - Fallout', 'Mission: Impossible - Fallout'],
    [
      'Star Wars: Episode I - The Phantom Menace',
      'Star Wars: Episode I - The Phantom Menace',
    ],
    // a suffix that only one film has can't be told from a subtitle, so it stays
    // and the title shows up as unmatched
    [
      'Les Parapluies de Cherbourg - Jacques Demy',
      'Les Parapluies de Cherbourg - Jacques Demy',
    ],
    // hyphens and en dashes inside a title
    ['Spider-Man', 'Spider-Man'],
    [
      'Ellie de Olifant – De Grote Reis - De Betovering',
      'Ellie de Olifant – De Grote Reis',
    ],
  ])('keeps what may belong to the title of %s', (title, expected) => {
    expect(cleanTitle(title, seriesLabels)).toBe(expected)
  })
})
