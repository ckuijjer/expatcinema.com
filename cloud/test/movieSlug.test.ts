import { slugifyMovieTitle } from '../metadata/titleResolver'

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
