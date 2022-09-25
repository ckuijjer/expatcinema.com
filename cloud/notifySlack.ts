const axios = require('axios')
const util = require('util')
const zlib = require('zlib')

// see https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/SubscriptionFilters.html#LambdaFunctionExample
// aws logs put-log-events --log-group-name test --log-stream-name test --log-events "[{\"timestamp\":1555846737890 , \"message\": \"Simple Lam bda Test Task timed out after sdf\"}]" --sequence-token 49593243400316228378531638056594071833748229412712679042

const filters = [
  /WARN/,
  /ERROR/,

  // /Task timed out after/, // running the lambda function times out
  // /UnhandledPromiseRejectionWarning/, // a promise rejection isn't handled
  // /"date": null'/, // a movie is extracted with null date
  // /socket hang up/, // no content received within the timeout period
  // /with status code: (4|5)\d{2}/, // HTTP error code 4xx, 5xx received
  // /Uncaught Exception/,
]

const gunzip = util.promisify(zlib.gunzip)

const notifySlack = async ({ awslogs } = {}) => {
  try {
    const payload = Buffer.from(awslogs.data, 'base64')

    const unzippedPayload = await gunzip(payload)

    const { logEvents } = JSON.parse(unzippedPayload.toString())

    const filteredLogEvents = logEvents.filter(({ message }) =>
      filters.some((f) => f.test(message)),
    )

    console.log(
      `Found ${logEvents.length} log events with ${filteredLogEvents.length} filtered to be posted to Slack`,
    )

    await Promise.all(filteredLogEvents.map(postToSlack))
  } catch (err) {
    console.error('notifySlack error', err)
  }
}

const postToSlack = (logEvent) => {
  console.log('SLACK_WEBHOOK', process.env.SLACK_WEBHOOK)

  return axios.post(process.env.SLACK_WEBHOOK, {
    text: logEvent.message,
  })
}

export default notifySlack
