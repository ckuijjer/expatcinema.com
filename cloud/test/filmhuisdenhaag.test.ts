import { cleanFilmhuisDenHaagTitle } from '../scrapers/utils/cleanFilmhuisDenHaagTitle'

describe('filmhuisdenhaag', () => {
  test('strips recurring program branding from screening titles', () => {
    expect(cleanFilmhuisDenHaagTitle('Bacurau - Laff')).toBe('Bacurau')
    expect(cleanFilmhuisDenHaagTitle('Climax - Drank & Drugs')).toBe('Climax')
    expect(cleanFilmhuisDenHaagTitle('Love Me Tender - Ciné Première')).toBe(
      'Love Me Tender',
    )
    expect(cleanFilmhuisDenHaagTitle('Wolf Children - Late Night Anime')).toBe(
      'Wolf Children',
    )
  })

  test('strips screening notes appended after a program label', () => {
    expect(
      cleanFilmhuisDenHaagTitle(
        'Bowels of Hell - Laff - En Subs Met Introductie',
      ),
    ).toBe('Bowels of Hell')
    expect(
      cleanFilmhuisDenHaagTitle(
        'Four Lions - This Is Not Funny - En Subs - Met Inleiding',
      ),
    ).toBe('Four Lions')
    expect(
      cleanFilmhuisDenHaagTitle('The Dragon Lives Again - Is This Bruce Lee?'),
    ).toBe('The Dragon Lives Again')
  })
})
