import { cleanTitle } from '../scrapers/filmhuisdenhaag'

describe('cleanTitle', () => {
  test.each([
    ['Fréwaka - Gather Round Folks - EN subs', 'Fréwaka'],
    [
      'Human Traffic - No Lonely Dancefloors - EN subs met inleiding',
      'Human Traffic',
    ],
    ['Hold Onto Me - LIFF - EN subs', 'Hold Onto Me'],
    ['Neptune Frost - BAM - EN subs', 'Neptune Frost'],
    ['Coward - First Pick - EN subs', 'Coward'],
    [
      'Children Who Chase Lost Voices - Late Night Anime',
      'Children Who Chase Lost Voices',
    ],
    ['Histoires Parallèles - EN subs', 'Histoires Parallèles'],
    ['Youri - met Q&A', 'Youri'],
    ['Akira (4K Restoration) - Late Night Anime', 'Akira'],
    ['Akira (Re-Release)', 'Akira'],
  ])(
    'removes the series, label and event suffixes of %s',
    (title, expected) => {
      expect(cleanTitle(title)).toBe(expected)
    },
  )

  test.each([
    ['Spider-Man', 'Spider-Man'],
    [
      'Ellie de Olifant – De Grote Reis - De Betovering',
      'Ellie de Olifant – De Grote Reis',
    ],
    ['Shall We Dance?', 'Shall We Dance?'],
  ])('keeps hyphens and dashes inside the title of %s', (title, expected) => {
    expect(cleanTitle(title)).toBe(expected)
  })
})
