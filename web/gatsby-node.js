const path = require(`path`)
const { inspect } = require('util')

// const remark = require('remark')
// const select = require('unist-util-select')
// const toString = require('mdast-util-to-string')

exports.createSchemaCustomization = ({ actions, schema }) => {
  const { createTypes } = actions

  const typeDefs = `
    type Screening implements Node {
      cinema: Cinema @link(by: "name")
    }

    type Cinema implements Node {
      city: City @link(by: "name")
      screenings: [Screening] @link(by: "cinema.name", from: "name")
    }

    type City implements Node {
      cinemas: [Cinema] @link(by: "city.name", from: "name")
    }`

  createTypes(typeDefs)
}

exports.createPages = async ({ actions, graphql, reporter }) => {
  const { createPage } = actions
  const CitiesTemplate = path.resolve(`src/templates/cities.js`)

  // only contains cities that have screenings, so won't be good enough
  const result = await graphql(`
    {
      allScreening {
        group(field: cinema___city___name) {
          nodes {
            date
            cinema {
              name
              city {
                name
              }
            }
            title
            url
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

  inspect({ result }, false, null, true)

  result.data.allScreening.group.forEach(({ nodes }) => {
    createPage({
      path: `cities/${nodes[0].cinema.city.name}`,
      component: CitiesTemplate,
      context: {
        screenings: nodes,
      }, // additional data can be passed via context
    })
  })
}
