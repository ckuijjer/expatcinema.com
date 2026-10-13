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

describe('The Wig', () => {
  test("is Emiliano Rocha Minter's La peluca, not the 2005 film", () => {
    expect(
      getManualTitleOverride(
        'Imagine Film Festival: the Wig (+ the Flesh Dress Short)',
      )?.tmdbId,
    ).toBe(1207380)
  })
})

describe('Tampopo', () => {
  test('is the 1985 film, whatever year a screening gives', () => {
    expect(
      getManualTitleOverride('Film & Food: Tampopo (Incl. Ramen)')?.tmdbId,
    ).toBe(11830)
    expect(
      getManualTitleOverride('Film & Food: Tampopo (Incl. Ramen)', 1988)
        ?.tmdbId,
    ).toBe(11830)
  })
})

describe("Andiamo a Bere L'ultima", () => {
  test("is Francesco Sossai's Le città di pianura (The Last One for the Road)", () => {
    expect(
      getManualTitleOverride("Andiamo a Bere L'ultima", 2025)?.tmdbId,
    ).toBe(1462322)
  })
})

describe('Suzaki Paradise Red Light', () => {
  test("is Yuzo Kawashima's Suzaki Paradise: Red Light District", () => {
    expect(
      getManualTitleOverride('Suzaki Paradise Red Light', 1956)?.tmdbId,
    ).toBe(125222)
  })
})

describe('Temple of the Wild Geese', () => {
  test("is Yuzo Kawashima's The Temple of Wild Geese", () => {
    expect(
      getManualTitleOverride('Temple of the Wild Geese', 1962)?.tmdbId,
    ).toBe(333361)
  })
})

describe('The Sun in the Last Days of the Shogunate', () => {
  test('is the 1957 Yuzo Kawashima film, not the 2017 film of the same English title', () => {
    expect(
      getManualTitleOverride('The Sun in the Last Days of the Shogunate', 1957)
        ?.tmdbId,
    ).toBe(125217)
  })
})

describe('No Way Down', () => {
  // Lab111 scrapes this as "Imagine Film Festival: No Way Down"; the shared-label
  // retry strips the festival prefix and looks up "No Way Down" again, so one
  // override entry covers both De Filmhallen and Lab111.
  test('is Kraken', () => {
    expect(getManualTitleOverride('No Way Down', 2026)?.tmdbId).toBe(1571766)
    expect(getManualTitleOverride('No Way Down')?.tmdbId).toBe(1571766)
  })
})
