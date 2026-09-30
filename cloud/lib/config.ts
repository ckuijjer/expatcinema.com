export type ConfigProps = {
  SLACK_BOT_TOKEN: string
  SLACK_CHANNEL: string
  TMDB_API_KEY: string
  OMDB_API_KEY: string
  SCRAPERS: string
  WEB_DEPLOY_TOKEN: string
  SCRAPE_RELAY_URL: string
  SCRAPE_RELAY_TOKEN: string
}

export const getConfig = (): ConfigProps => {
  const config = {
    SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN || '',
    SLACK_CHANNEL: process.env.SLACK_CHANNEL || '',
    TMDB_API_KEY: process.env.TMDB_API_KEY || '',
    OMDB_API_KEY: process.env.OMDB_API_KEY || '',
    SCRAPERS: process.env.SCRAPERS || '',
    WEB_DEPLOY_TOKEN: process.env.WEB_DEPLOY_TOKEN || '',
    SCRAPE_RELAY_URL: process.env.SCRAPE_RELAY_URL || '',
    SCRAPE_RELAY_TOKEN: process.env.SCRAPE_RELAY_TOKEN || '',
  }
  return config
}
