// Pages whose content does not change with the screenings
const staticPaths = ['/about']

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://www.expatcinema.com',
  generateRobotsTxt: true,
  outDir: 'out',
  // internal pages, they are noindex
  exclude: ['/movie/unmatched', '/statistics'],
  // The listings change with every scrape, so they get the date of this build,
  // which is the date of the data. The about page has no lastmod, as it would
  // claim a change that did not happen
  transform: async (config, path) => ({
    loc: path,
    changefreq: config.changefreq,
    priority: config.priority,
    lastmod: staticPaths.includes(path)
      ? undefined
      : new Date().toISOString().slice(0, 10),
    alternateRefs: config.alternateRefs ?? [],
  }),
}
