import { getManualTitleOverride } from '../metadata/manualTitleOverrides'

describe('Shall We Dance?', () => {
  // the 30th anniversary screenings are of the 1996 film, not the 2004 remake
  test.each([
    ['Shall We Dance?', 1996],
    ['Shall We Dance?', 2026],
    ['Shall We Dance?', undefined],
    ['Shall We Dance? (30th Anniversary)', undefined],
    ['Shall We Dance? (30th Anniversary)', 1996],
    ['Shall We Dance? - 30th Anniversary', undefined],
  ])('%s (%s) is the 1996 film', (title, year) => {
    expect(getManualTitleOverride(title, year)?.tmdbId).toBe(11239)
  })

  test('does not apply to another title', () => {
    expect(getManualTitleOverride('Shall We Dance Again?')).toBeUndefined()
  })
})
