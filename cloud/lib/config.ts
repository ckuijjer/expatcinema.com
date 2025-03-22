export type ConfigProps = {
  SLACK_WEBHOOK: string
  TMDB_API_KEY: string
  OMDB_API_KEY: string
  GOOGLE_CUSTOM_SEARCH_ID: string
  GOOGLE_CUSTOM_SEARCH_API_KEY: string
  SCRAPERS: string
  SCRAPEOPS_API_KEY: string
}

export const getConfig = (): ConfigProps => {
  const config = {
    SLACK_WEBHOOK: process.env.SLACK_WEBHOOK || '',
    TMDB_API_KEY: process.env.TMDB_API_KEY || '',
    OMDB_API_KEY: process.env.OMDB_API_KEY || '',
    GOOGLE_CUSTOM_SEARCH_ID: process.env.GOOGLE_CUSTOM_SEARCH_ID || '',
    GOOGLE_CUSTOM_SEARCH_API_KEY:
      process.env.GOOGLE_CUSTOM_SEARCH_API_KEY || '',
    SCRAPERS: process.env.SCRAPERS || '',
    SCRAPEOPS_API_KEY: process.env.SCRAPEOPS_API_KEY || '',
  }
  console.log('⚙️', { config })

  return config
}
