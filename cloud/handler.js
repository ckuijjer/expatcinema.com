const { scrapers } = require('./scrapers')
const { playground } = require('./playground')
const { notifySlack } = require('./notify-slack')
const { analytics } = require('./analytics')

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

module.exports.notifySlack = async (event, context) =>
  await notifySlack({ event, context })

module.exports.analytics = async (event, context) =>
  await analytics({ event, context })
