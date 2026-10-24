import { getMovieSlug, slugifyMovieTitle } from '../metadata/titleResolver'

describe('slugifyMovieTitle', () => {
  test('slugifies a simple title', () => {
    expect(slugifyMovieTitle('A Family')).toBe('a-family')
  })

  test('strips punctuation and diacritics', () => {
    expect(slugifyMovieTitle('Sirāt')).toBe('sirat')
    expect(slugifyMovieTitle("Kiki's Delivery Service")).toBe(
      'kiki-s-delivery-service',
    )
  })

  test('collapses noisy separators', () => {
    expect(slugifyMovieTitle('The Wolf, the Fox and the Leopard')).toBe(
      'the-wolf-the-fox-and-the-leopard',
    )
  })
})

describe('getMovieSlug', () => {
  test('is the slug of the title', () => {
    expect(getMovieSlug({ title: 'A Family', query: 'a family' })).toBe(
      'a-family',
    )
  })

  test('a title without latin letters uses the title the cinemas use', () => {
    expect(
      getMovieSlug({ title: 'रामायण', query: 'ramayana', tmdbId: 656908 }),
    ).toBe('ramayana')
  })

  test('uses the TMDB id when neither title has a slug', () => {
    expect(
      getMovieSlug({ title: '東京物語', query: '東京物語', tmdbId: 18148 }),
    ).toBe('tmdb-18148')
  })
})
