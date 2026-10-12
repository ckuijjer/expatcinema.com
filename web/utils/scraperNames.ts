import cinemas from '../data/cinema.json'

const compact = (text: string) => text.replace(/[^a-z0-9]/gi, '').toLowerCase()

// Most scraper keys are the cinema's slug without the dashes (lab-1 -> lab1)
const cinemaNameByKey = new Map(
  cinemas.map((cinema) => [compact(cinema.slug), cinema.name]),
)

const cinemaNameBySlug = new Map(
  cinemas.map((cinema) => [cinema.slug, cinema.name]),
)

// Scraper keys that are not their cinema's slug without the dashes
const slugByKey: Record<string, string> = {
  amstelveen: 'cinema-amstelveen',
  castellum: 'castellum-theater-film',
  chasse: 'chasse-cinema',
  dewittdordrecht: 'filmtheater-de-witt',
  eyefilm: 'eye',
  filmhuisbreda: 'filmhuis-botanique-breda',
  hartlooper: 'louis-hartlooper-complex',
  kinorotterdam: 'kino',
  rialto: 'rialto-de-pijp',
}

// Not a cinema, or one scraper for more than one
const otherNames: Record<string, string> = {
  all: 'All screenings',
  allWithMovieId: 'Matched with TMDB',
  bioscopenleiden: 'Leiden (Kijkhuis, Lido, Trianon)',
}

// A scraper that is not known yet shows its key
export const getScraperName = (scraper: string) =>
  otherNames[scraper] ??
  cinemaNameBySlug.get(slugByKey[scraper]) ??
  cinemaNameByKey.get(scraper) ??
  scraper
