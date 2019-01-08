const AWS = require('aws-sdk')

const { scrapers } = require('./scrapers')
const { playground } = require('./playground')

module.exports.scrapers = async (event, context) => {
  await scrapers()

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless v1.0! Your function executed successfully!',
      input: event,
    }),
  }

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
}

module.exports.playground = async (event, context) =>
  await playground({ event, context })
