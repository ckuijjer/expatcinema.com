module.exports = {
  siteMetadata: {
    title: 'Expat Cinema',
    description: 'Foreign movies with English subtitles',
    author: 'Expat Cinema',
    siteUrl: 'https://www.expatcinema.com',
  },
  plugins: [
    `gatsby-transformer-json`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `src/data/`,
      },
    },
    {
      resolve: 'gatsby-source-remote-file',
      options: {
        url: 'https://s3-eu-west-1.amazonaws.com/expatcinema-public/screenings.json',
        name: 'screenings',
      },
    },
    'gatsby-plugin-emotion',
    {
      resolve: 'gatsby-plugin-google-analytics',
      options: {
        trackingId: 'UA-127056408-1',
      },
    },
    'gatsby-plugin-react-helmet',
    'gatsby-plugin-robots-txt',
    'gatsby-plugin-sitemap',
    'gatsby-plugin-react-svg',
  ],
}
