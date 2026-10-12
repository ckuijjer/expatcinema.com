import cinemas from '../data/cinema.json'

// The cinemas of a scraper, most scrapers have one, bioscopenleiden has three
const namesByScraper = new Map<string, string[]>()
for (const { scraper, name } of cinemas) {
  namesByScraper.set(scraper, [...(namesByScraper.get(scraper) ?? []), name])
}

// Not a cinema
const otherNames: Record<string, string> = {
  all: 'All screenings',
  allWithMovieId: 'Matched with TMDB',
}

// A scraper that is not known yet shows its key
export const getScraperName = (scraper: string) =>
  otherNames[scraper] ?? namesByScraper.get(scraper)?.join(', ') ?? scraper
