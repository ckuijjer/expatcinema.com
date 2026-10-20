import { findDirectorInJsonLd } from '../scrapers/utils/findDirectorInJsonLd'

describe('findDirectorInJsonLd', () => {
  test('a director that is a string', () => {
    expect(
      findDirectorInJsonLd('{"@type":"Movie","director":"Annemarie Jacir"}'),
    ).toBe('Annemarie Jacir')
  })

  test('a director that is a Person', () => {
    expect(
      findDirectorInJsonLd(
        '{"@type":"Movie","director":{"@type":"Person","name":"Lukas Dhont"}}',
      ),
    ).toBe('Lukas Dhont')
  })

  test('a list of directors is joined', () => {
    expect(
      findDirectorInJsonLd(
        '{"director":[{"@type":"Person","name":"Yuval Abraham"},{"@type":"Person","name":"Rachel Szor"}]}',
      ),
    ).toBe('Yuval Abraham, Rachel Szor')
  })

  test('finds a director nested in an event and in a @graph', () => {
    expect(
      findDirectorInJsonLd(
        '{"@graph":[{"@type":"Event","workPresented":{"@type":"Movie","director":"X Y"}}]}',
      ),
    ).toBe('X Y')
  })

  test('skips invalid blocks and uses the first block with a director', () => {
    expect(
      findDirectorInJsonLd([
        'not json',
        '{"@type":"Organization","name":"Lux"}',
        '{"director":"A B"}',
      ]),
    ).toBe('A B')
  })

  test('a director that is in several blocks is listed once', () => {
    expect(
      findDirectorInJsonLd(['{"director":"A B"}', '{"director":"A B"}']),
    ).toBe('A B')
  })

  test('no director gives undefined', () => {
    expect(findDirectorInJsonLd('{"director":""}')).toBeUndefined()
    expect(findDirectorInJsonLd(undefined)).toBeUndefined()
  })
})
