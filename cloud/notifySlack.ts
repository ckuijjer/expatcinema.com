import got from 'got'
import util from 'util'
import zlib from 'zlib'

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

type CloudWatchLogsEvent = {
  awslogs: {
    data: string
  }
}

type LogEvent = {
  message: string
}

type SlackBlock = {
  type: string
  text: {
    type: string
    text: string
  }
}

const notifySlack = async ({ awslogs }: CloudWatchLogsEvent) => {
  const payload = Buffer.from(awslogs.data, 'base64')

  const unzippedPayload = await gunzip(payload)

  const { logEvents } = JSON.parse(unzippedPayload.toString()) as {
    logEvents: LogEvent[]
  }

  const filteredLogEvents = logEvents.filter(({ message }) =>
    filters.some((f) => f.test(message)),
  )

  const slackBlocks = filteredLogEvents.map(getSlackBlocks)

  await Promise.all(slackBlocks.map(postToSlack))
}

const levelsToEmoji = {
  INFO: ':information_source:',
  WARN: ':warning:',
  ERROR: ':sos:',
  DEBUG: ':information_source:',
}

const getSlackBlocks = (logEvent: LogEvent): SlackBlock[] => {
  try {
    const json = JSON.parse(logEvent.message) as {
      level?: keyof typeof levelsToEmoji
      message: string
    }

    const blocks = [
      {
        type: 'section',
        text: {
          type: 'plain_text',
          text: `${levelsToEmoji[json.level ?? 'INFO']} ${json.message}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '```' + JSON.stringify(json, null, 2) + '```',
        },
      },
    ]
    return blocks
  } catch (error) {
    console.info('couldnt parse logEvent', {
      logEvent,
      error,
    })

    return [
      { type: 'section', text: { type: 'plain_text', text: logEvent.message } },
    ]
  }
}

const postToSlack = (blocks: SlackBlock[]) => {
  const slackWebhook = process.env.SLACK_WEBHOOK
  if (!slackWebhook) {
    throw new Error('SLACK_WEBHOOK is required')
  }

  return got.post(slackWebhook, {
    json: { blocks },
  })
}

export const handler = notifySlack
