/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://www.expatcinema.com',
  generateRobotsTxt: true,
  outDir: 'out',
  // internal pages, they are noindex
  exclude: ['/movie/unmatched', '/statistics'],
}
