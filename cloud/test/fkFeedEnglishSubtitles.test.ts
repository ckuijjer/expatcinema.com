import { fkFeedHasEnglishSubtitles } from '../scrapers/utils/fkFeedEnglishSubtitles'

const englishLabel = { language: { label: 'Ondertitels', value: 'Engels' } }
const dutchLabel = { language: { label: 'Ondertitels', value: 'Nederlands' } }
const noLabel = { language: '' as const }

describe('fkFeedHasEnglishSubtitles', () => {
  test('accepts a movie labelled with English subtitles', () => {
    expect(fkFeedHasEnglishSubtitles(englishLabel, { tags: [] })).toBe(true)
    expect(
      fkFeedHasEnglishSubtitles(
        { language: { label: 'Ondertitels', value: 'English' } },
        { tags: [] },
      ),
    ).toBe(true)
  })

  test.each(['EN SUBS', 'EN Subs', 'EN subs', 'ENGLISH SUBS', ' en subs '])(
    'accepts a screening tagged %p',
    (tag) => {
      expect(fkFeedHasEnglishSubtitles(noLabel, { tags: [tag] })).toBe(true)
      expect(fkFeedHasEnglishSubtitles(dutchLabel, { tags: ['2D', tag] })).toBe(
        true,
      )
    },
  )

  test('rejects screenings without an English marker', () => {
    expect(fkFeedHasEnglishSubtitles(dutchLabel, { tags: ['3D'] })).toBe(false)
    expect(fkFeedHasEnglishSubtitles(noLabel, { tags: [] })).toBe(false)
    expect(fkFeedHasEnglishSubtitles(noLabel, {})).toBe(false)
    expect(fkFeedHasEnglishSubtitles(noLabel, { tags: ['Expat Cinema'] })).toBe(
      false,
    )
  })

  test('a "no subs" screening overrides an English movie label', () => {
    expect(fkFeedHasEnglishSubtitles(englishLabel, { tags: ['No Subs'] })).toBe(
      false,
    )
    expect(
      fkFeedHasEnglishSubtitles(englishLabel, {
        tags: ['Geen ondertiteling'],
      }),
    ).toBe(false)
  })
})
