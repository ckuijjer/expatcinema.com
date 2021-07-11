const path = require(`path`)
const { inspect } = require('util')

// const remark = require('remark')
// const select = require('unist-util-select')
// const toString = require('mdast-util-to-string')

exports.createSchemaCustomization = ({ actions, schema }) => {
  const { createTypes } = actions

  const typeDefs = [
    `type Screening implements Node {
      cinema: Cinema @link(by: "name")
    }
    type Cinema implements Node {
      city: City @link(by: "name")
      screenings: [Screening] @link(by: "cinema.name", from: "name")
    }
    type City implements Node {
      cinemas: [Cinema] @link(by: "city.name", from: "name")
      screenings: [Screening] @link(by: "cinema.city.name", from: "name")
    }`,
  ]

  createTypes(typeDefs)
}

exports.createPages = async ({ actions, graphql, reporter }) => {
  const { createPage } = actions
  const CityTemplate = path.resolve(`src/templates/city.js`)

  // only contains cities that have screenings, so won't be good enough
  const result = await graphql(`
    {
      allCity {
        nodes {
          name
          id
          screenings {
            url
            title
            date
          }
        }
      }
    }
  `)

  // Handle errors
  if (result.errors) {
    reporter.panicOnBuild(`Error while running GraphQL query.`)
    return
  }

  result.data.allCity.nodes.forEach((node) => {
    createPage({
      path: `city/${node.name.toLowerCase()}`,
      component: CityTemplate,
      context: {
        id: node.id,
      },
    })
  })
}
