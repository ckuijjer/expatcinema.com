require('dotenv').config({
  path: `.env.${process.env.NODE_ENV}`,
})

module.exports = {
  siteMetadata: {
    title: 'Expat Cinema',
    description: 'Foreign movies with English subtitles',
    author: 'Expat Cinema',
    siteUrl: 'https://www.expatcinema.com',
  },
  plugins: [
    {
      resolve: `gatsby-transformer-json`,
      options: {
        typeName: ({ node }) =>
          node.name.charAt(0).toUpperCase() + node.name.slice(1),
      },
    },
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
        name: 'screening',
      },
    },
    {
      resolve: 'gatsby-source-remote-file',
      options: {
        url: 'https://a8kqub7595.execute-api.eu-west-1.amazonaws.com/analytics',
        name: 'analytics',
        ext: '.json',
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
    {
      resolve: 'gatsby-plugin-sitemap',
      options: {
        excludes: ['analytics'],
      },
    },
    'gatsby-plugin-react-svg',
    'gatsby-plugin-loadable-components-ssr',
    // {
    //   resolve: 'gatsby-plugin-webpack-bundle-analyzer',
    //   options: {
    //     production: true,
    //   },
    // },
  ],
}
