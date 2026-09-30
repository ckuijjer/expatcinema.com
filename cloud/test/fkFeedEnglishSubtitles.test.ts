import { fkFeedHasEnglishSubtitles } from '../scrapers/utils/fkFeedEnglishSubtitles'

// Labels and tags below are taken from the cinemas' own /fk-feed/agenda
// feeds (2026-09-28..30).
const label = (value: string) => ({
  language: { label: 'Ondertitels', value },
})
const noLabel = { language: '' as const }

describe('fkFeedHasEnglishSubtitles', () => {
  describe('movie label', () => {
    test.each(['Engels', 'English'])('accepts a plain %p label', (value) => {
      expect(fkFeedHasEnglishSubtitles(label(value), { tags: [] })).toBe(true)
    })

    test.each(['Nederlands', 'Geen', 'None', '-', 'Nederland'])(
      'rejects %p',
      (value) => {
        expect(fkFeedHasEnglishSubtitles(label(value), { tags: [] })).toBe(
          false,
        )
      },
    )

    test('rejects a label that is only partly English (Kino)', () => {
      expect(
        fkFeedHasEnglishSubtitles(label('English on the Czech parts'), {
          tags: [],
        }),
      ).toBe(false)
    })
  })

  describe('venue-qualified labels (Utrecht: LHC, Slachtstraat, Springhaver)', () => {
    const naza = label('Nederlands (LHC), English (Springhaver)')
    const akira = label('Nederlands (Slachtstraat), English (Springhaver)')
    const colony = label('English (Springhaver)')
    const yellowLetters = label('Nederlands, English (Springhaver)')
    // missing closing parenthesis, as in the feed
    const cycleOfLove = label('Nederlands (LHC, English (Springhaver)')

    test('counts as English for the venue named with English', () => {
      for (const movie of [naza, akira, colony, yellowLetters, cycleOfLove]) {
        expect(
          fkFeedHasEnglishSubtitles(
            movie,
            { tags: [] },
            { venues: ['Springhaver'] },
          ),
        ).toBe(true)
      }
    })

    test('does not count as English for the other venues', () => {
      const lhc = { venues: ['LHC', 'Louis Hartlooper'] }
      const slachtstraat = { venues: ['Slachtstraat'] }
      expect(fkFeedHasEnglishSubtitles(naza, { tags: [] }, lhc)).toBe(false)
      expect(fkFeedHasEnglishSubtitles(cycleOfLove, { tags: [] }, lhc)).toBe(
        false,
      )
      expect(fkFeedHasEnglishSubtitles(akira, { tags: [] }, slachtstraat)).toBe(
        false,
      )
    })

    test('does not count as English for a scraper that passes no venues', () => {
      expect(fkFeedHasEnglishSubtitles(naza, { tags: [] })).toBe(false)
    })

    test('a screening tag still counts at any venue', () => {
      expect(
        fkFeedHasEnglishSubtitles(
          label('Nederlands (Slachtstraat), English (Springhaver)'),
          { tags: ['EN Subs', 'Voorpremière'] },
          { venues: ['Slachtstraat'] },
        ),
      ).toBe(true)
    })
  })

  describe('screening tags', () => {
    test.each(['EN SUBS', 'EN Subs', 'EN subs', 'ENGLISH SUBS', ' en subs '])(
      'accepts %p',
      (tag) => {
        expect(fkFeedHasEnglishSubtitles(noLabel, { tags: [tag] })).toBe(true)
        expect(
          fkFeedHasEnglishSubtitles(label('Nederlands'), { tags: ['2D', tag] }),
        ).toBe(true)
      },
    )

    test('rejects screenings without an English marker', () => {
      expect(
        fkFeedHasEnglishSubtitles(label('Nederlands'), { tags: ['3D'] }),
      ).toBe(false)
      expect(fkFeedHasEnglishSubtitles(noLabel, { tags: [] })).toBe(false)
      expect(fkFeedHasEnglishSubtitles(noLabel, {})).toBe(false)
    })

    test('cinema-specific extra tags (Bioscopen Leiden: "Expat Cinema")', () => {
      expect(
        fkFeedHasEnglishSubtitles(noLabel, { tags: ['Expat Cinema'] }),
      ).toBe(false)
      expect(
        fkFeedHasEnglishSubtitles(
          noLabel,
          { tags: ['Expat Cinema'] },
          { extraTags: ['Expat Cinema'] },
        ),
      ).toBe(true)
    })

    test('a "no subs" screening overrides an English label or tag', () => {
      expect(
        fkFeedHasEnglishSubtitles(label('Engels'), { tags: ['No Subs'] }),
      ).toBe(false)
      expect(
        fkFeedHasEnglishSubtitles(label('English'), {
          tags: ['Geen ondertiteling'],
        }),
      ).toBe(false)
      expect(
        fkFeedHasEnglishSubtitles(noLabel, { tags: ['EN SUBS', 'No subs'] }),
      ).toBe(false)
    })
  })
})
