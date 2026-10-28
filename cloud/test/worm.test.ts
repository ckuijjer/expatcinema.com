import { onlyOnAgenda, parseTitleAndYear } from '../scrapers/worm'

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

const page = (paragraph: string) => ({
  title: 'LA COSA EN LA NIEBLA aka The Thing in the Fog',
  programme: '',
  dateText: '',
  startText: '',
  detailParagraphs: [paragraph],
})

describe('worm parseTitleAndYear', () => {
  test('takes the title and year from the metadata paragraph', () => {
    expect(
      parseTitleAndYear(
        page(
          'Wolf and Dog by Cláudia Varejão Portugal | 2022 | with English subtitles',
        ),
      ),
    ).toEqual({ title: 'Wolf and Dog', year: 2022 })
  })

  test('leaves out the markdown bold of a paragraph that has it', () => {
    expect(
      parseTitleAndYear(
        page(
          '** La Cosa en la Niebla aka The Thing in the Fog by Chedey Reyes Spain | 83" | 2025 | Spanish with English subtitles**',
        ),
      ),
    ).toEqual({
      title: 'La Cosa En La Niebla Aka the Thing in the Fog',
      year: 2025,
    })
  })
})
