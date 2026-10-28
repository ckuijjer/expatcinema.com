import { onlyOnAgenda } from '../scrapers/worm'

const production = (slug: string) => ({
  id: 1,
  title: slug,
  url: `https://worm.org/production/${slug}/`,
  subtype: 'wp_theatre_prod',
})

describe('worm onlyOnAgenda', () => {
  test('keeps only the productions that are on the agenda', () => {
    const result = onlyOnAgenda(
      [production('past'), production('upcoming')],
      [
        'https://worm.org/production/upcoming/',
        'https://worm.org/production/other/',
      ],
    )

    expect(result.map(({ title }) => title)).toEqual(['upcoming'])
  })

  test('keeps nothing for an empty agenda', () => {
    expect(onlyOnAgenda([production('a')], [])).toEqual([])
  })
})
