import { cleanTitle } from '../scrapers/heerenstraattheater'

describe('heerenstraattheater cleanTitle', () => {
  it('removes ENG SUB before the title', () => {
    expect(cleanTitle('ENG SUB Naza')).toBe('Naza')
  })

  it('removes ENG SUB after the title', () => {
    expect(cleanTitle('Naza ENG SUB')).toBe('Naza')
  })

  it('keeps a title without it', () => {
    expect(cleanTitle('Naza')).toBe('Naza')
  })
})
