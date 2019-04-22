const axios = require('axios')
const util = require('util')
const zlib = require('zlib')

// see https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/SubscriptionFilters.html#LambdaFunctionExample
// aws logs put-log-events --log-group-name test --log-stream-name test --log-events "[{\"timestamp\":1555846737890 , \"message\": \"Simple Lam bda Test Task timed out after sdf\"}]" --sequence-token 49593243400316228378531638056594071833748229412712679042

const filters = [/Task timed out after/]

const gunzip = util.promisify(zlib.gunzip)

const notifySlack = async ({ event, context } = {}) => {
  const payload = new Buffer(event.awslogs.data, 'base64')

  const unzippedPayload = await gunzip(payload)

  const { logEvents } = JSON.parse(unzippedPayload.toString())

  const filteredLogEvents = logEvents.filter(({ message }) =>
    filters.some(f => f.test(message)),
  )

  await Promise.all(filteredLogEvents.map(postToSlack))
}

const postToSlack = logEvent =>
  axios.post(process.env.SLACK_WEBHOOK, {
    text: logEvent.message,
  })

exports.notifySlack = notifySlack
