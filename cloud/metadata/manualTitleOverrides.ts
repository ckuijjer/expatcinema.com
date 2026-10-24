import { normalizeMovieTitleForLookup } from './titleResolver'

type ManualTitleOverrideInput = {
  title: string
  year?: number
  tmdbId?: number
  imdbId?: string
  note?: string
  addedAt: string
}

export type ManualTitleOverride = ManualTitleOverrideInput & {
  query: string
}

const rawOverrides: ManualTitleOverrideInput[] = [
  {
    title: 'A Family',
    year: 2024,
    tmdbId: 1359694,
    note: 'Kino returns the wrong release year for A Family; force the 2026 TMDB match.',
    addedAt: '2026-04-24',
  },
  {
    title: 'The Exit 8',
    tmdbId: 1408208,
    note: 'Forum Groningen returns the wrong title for Exit 8; force the correct TMDB match.',
    addedAt: '2026-04-24',
  },
  {
    title: 'Kill Bill: the Whole Bloody Affair',
    year: 2006,
    tmdbId: 414419,
    note: 'Kino returns the release year for Kill Bill: Vol. 1 instead of the correct year for the combined Kill Bill: the Whole Bloody Affair; force the correct TMDB match.',
    addedAt: '2026-04-24',
  },
  {
    title: 'The Great Adventure of Horus Prince of the Sun',
    year: 1968,
    tmdbId: 52686,
    note: 'Kino returns a slightly different title',
    addedAt: '2026-04-24',
  },
  {
    title: 'The Great Adventure of Horus, Prince of the Sun',
    year: 1968,
    tmdbId: 52686,
    note: 'Slachtstraat returns a slightly different title',
    addedAt: '2026-04-24',
  },
  {
    title: 'Shall We Dance?',
    tmdbId: 11239,
    note: 'The 30th anniversary screenings are of the 1996 Japanese film (Shall we ダンス?). Without this the resolver picks the 2004 remake by popularity, also when the year is 1996.',
    addedAt: '2026-10-07',
  },
  {
    title: 'Shall We Dance? (30th Anniversary)',
    tmdbId: 11239,
    note: 'The 30th anniversary screenings are of the 1996 Japanese film (Shall we ダンス?), not the 2004 remake.',
    addedAt: '2026-10-07',
  },
  {
    title: 'Shall We Dance? - 30th Anniversary',
    tmdbId: 11239,
    note: 'Forum Groningen: the 30th anniversary screening of the 1996 Japanese film (Shall we ダンス?), not the 2004 remake.',
    addedAt: '2026-10-07',
  },
  {
    title: 'the Wig (+ the Flesh Dress Short)',
    tmdbId: 1207380,
    note: 'Lab111 shows La peluca (The Wig, 2026, Emiliano Rocha Minter) with the short The Flesh Dress. Without this "The Wig" matches an older film of that name (2005).',
    addedAt: '2026-10-07',
  },
  {
    title: 'Tampopo (Incl. Ramen)',
    tmdbId: 11830,
    note: "Lab111 page and TMDB agree on director (Juzo Itami), cast (Ken Watanabe, Tsutomu Yamazaki, Nobuko Miyamoto) and runtime (114 vs 115 min). The page's Release date (6 October 1988) is the Dutch release, the film is from 1985, so with a year from that date it stays unmatched.",
    addedAt: '2026-10-07',
  },
  {
    title: "Andiamo a Bere L'ultima",
    year: 2025,
    tmdbId: 1462322,
    note: 'Lab111 and Filmtheater Hilversum agree with TMDB on director (Francesco Sossai) and runtime (100 vs 98 min); TMDB lists the film under its other title, Le città di pianura (The Last One for the Road). A plain TMDB search for the Italian title finds no candidate.',
    addedAt: '2026-10-13',
  },
  {
    title: 'Suzaki Paradise Red Light',
    year: 1956,
    tmdbId: 125222,
    note: "Eye's page and TMDB agree on director (Yuzo Kawashima), runtime (81 min) and original title (洲崎パラダイス 赤信号 / Suzaki paradaisu akashingo). The resolver only finds it as a 0.76-confidence unmatched candidate because of the missing colon in Eye's title.",
    addedAt: '2026-10-13',
  },
  {
    title: 'Temple of the Wild Geese',
    year: 1962,
    tmdbId: 333361,
    note: 'Eye\'s page and TMDB agree on director (Yuzo Kawashima), runtime (98 min) and original title (雁の寺). TMDB\'s title drops the leading article ("The Temple of Wild Geese"), which keeps it below the match threshold.',
    addedAt: '2026-10-13',
  },
  {
    title: 'The Sun in the Last Days of the Shogunate',
    year: 1957,
    tmdbId: 125217,
    note: "Eye's page and TMDB agree on director (Yuzo Kawashima), runtime (110 min) and original title (幕末太陽傳 / Bakumatsu Taiyoden). Without this the resolver prefers a more popular 2017 film with the same English title and no release-date agreement.",
    addedAt: '2026-10-13',
  },
  {
    title: 'No Way Down',
    year: 2026,
    tmdbId: 1571766,
    note: "De Filmhallen's and Lab111's (as \"Imagine Film Festival: No Way Down\") pages agree with TMDB's Kraken on director (Mohamed Chabane & Théo Jourdain), cast (Alassane Diong, Manon Bresch, Guillaume Gouix, Gazo) and synopsis (a group trapped in the abandoned 'Kraken' tower).",
    addedAt: '2026-10-13',
  },
  {
    title: 'Cold War (Incl. Drink and Antipasti Platter)',
    year: 2018,
    tmdbId: 440298,
    note: "Lab111's page and TMDB agree on director (Paweł Pawlikowski) and runtime (88 min).",
    addedAt: '2026-10-20',
  },
  {
    title:
      "Daft Punk & Leiji Matsumoto's Interstella 5555: the 5tory of the 5ecret 5tar 5ystem",
    year: 2003,
    tmdbId: 11049,
    note: "Lab111's page and TMDB agree on director (Kazuhisa Takenouchi), runtime (68 min) and release date (2003); the resolver scores the full scraped title (with the 'Daft Punk & Leiji Matsumoto's' prefix) just under the match threshold.",
    addedAt: '2026-10-20',
  },
  {
    title: 'The Time Masters Incl. Introduction',
    year: 1982,
    tmdbId: 22501,
    note: "Lab111's page and TMDB agree on director (René Laloux) and original title (Les Maîtres du temps, 1982); without this, the trailing 'Incl. Introduction' is never stripped and the title isn't looked up at all.",
    addedAt: '2026-10-20',
  },
  {
    title: 'Frank',
    tmdbId: 171372,
    note: "Filmhuis Den Haag's page (filmhuisdenhaag.nl/films/frank-band) and TMDB agree on director (Lenny Abrahamson) and runtime (95 min); the cinema's own page lists the year as 1900 (its countries line reads 'Verenigd Koninkrijk, Ierland, Verenigde Staten , 1900'), so the resolver never considers this a 2014 film.",
    addedAt: '2026-10-20',
  },
  {
    title: 'The Promised Land',
    tmdbId: 511,
    note: "De Balie's Amsterdam Polish Film Festival page is Andrzej Wajda's Ziemia obiecana (1975, 'Wajda's 1975 masterpiece'); the page has no year, so the resolver picked the 2023 Danish Bastarden, which TMDB also titles The Promised Land.",
    addedAt: '2026-10-22',
  },
]

export const manualTitleOverrides: ManualTitleOverride[] = rawOverrides.map(
  (override) => ({
    ...override,
    query: normalizeMovieTitleForLookup(override.title),
  }),
)

export const getManualTitleOverride = (title: string, year?: number) => {
  const query = normalizeMovieTitleForLookup(title)
  return (
    manualTitleOverrides.find(
      (override) => override.query === query && override.year === year,
    ) ?? manualTitleOverrides.find((override) => override.query === query)
  )
}
