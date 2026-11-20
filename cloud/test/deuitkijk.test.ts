import { cleanTitle, hasEnglishSubtitles } from '../scrapers/deuitkijk'

describe('deuitkijk', () => {
  describe('cleanTitle', () => {
    test('strips the HoFF guest-programme prefix', () => {
      expect(cleanTitle('HoFF | Soumsoum, The Night of the Stars (2026)')).toBe(
        'Soumsoum, the Night of the Stars',
      )
    })

    test('strips the Klassieker programme prefix', () => {
      expect(cleanTitle('Klassieker: Tampopo')).toBe('Tampopo')
    })
  })

  describe('hasEnglishSubtitles', () => {
    test('is true when the metadata lists English subtitles', () => {
      expect(
        hasEnglishSubtitles({
          metadata: ['Taal: Frans', 'Ondertiteling: Engels', 'Jaar: 2026'],
        }),
      ).toBe(true)
    })

    test('is false without an English subtitles entry', () => {
      expect(
        hasEnglishSubtitles({
          metadata: ['Taal: Nederlands', 'Ondertiteling: Geen', 'Jaar: 2026'],
        }),
      ).toBe(false)
    })
  })
})
