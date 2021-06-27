module.exports = {
  siteMetadata: {
    title: 'Expat Cinema',
    siteUrl: 'https://www.expatcinema.com',
  },
  plugins: [
    'gatsby-plugin-emotion',
    {
      resolve: 'gatsby-plugin-google-analytics',
      options: {
        trackingId: 'UA-127056408-1',
      },
    },
    'gatsby-plugin-react-helmet',
    'gatsby-plugin-sitemap',
    'gatsby-plugin-react-svg',
  ],
}
