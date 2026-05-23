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

type SlackMessage = {
  mainBlock: SlackBlock
  threadBlock: SlackBlock | null
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

  const slackMessages = filteredLogEvents.map(getSlackMessage)

  await Promise.all(slackMessages.map(postToSlack))
}

const levelsToEmoji = {
  INFO: ':information_source:',
  WARN: ':warning:',
  ERROR: ':sos:',
  DEBUG: ':information_source:',
}

const getSlackMessage = (logEvent: LogEvent): SlackMessage => {
  try {
    const json = JSON.parse(logEvent.message) as {
      level?: keyof typeof levelsToEmoji
      message: string
    }

    return {
      mainBlock: {
        type: 'section',
        text: {
          type: 'plain_text',
          text: `${levelsToEmoji[json.level ?? 'INFO']} ${json.message}`,
        },
      },
      threadBlock: {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '```' + JSON.stringify(json, null, 2) + '```',
        },
      },
    }
  } catch (error) {
    console.info('couldnt parse logEvent', {
      logEvent,
      error,
    })

    return {
      mainBlock: {
        type: 'section',
        text: { type: 'plain_text', text: logEvent.message },
      },
      threadBlock: null,
    }
  }
}

const postToSlack = async ({ mainBlock, threadBlock }: SlackMessage) => {
  const slackBotToken = process.env.SLACK_BOT_TOKEN
  if (!slackBotToken) {
    throw new Error('SLACK_BOT_TOKEN is required')
  }

  const channel = process.env.SLACK_CHANNEL
  if (!channel) {
    throw new Error('SLACK_CHANNEL is required')
  }

  const response = await got
    .post('https://slack.com/api/chat.postMessage', {
      headers: { Authorization: `Bearer ${slackBotToken}` },
      json: { channel, blocks: [mainBlock] },
    })
    .json<{ ok: boolean; ts: string; error?: string }>()

  if (!response.ok) {
    throw new Error(`Slack API error: ${response.error}`)
  }

  if (threadBlock) {
    const threadResponse = await got
      .post('https://slack.com/api/chat.postMessage', {
        headers: { Authorization: `Bearer ${slackBotToken}` },
        json: { channel, thread_ts: response.ts, blocks: [threadBlock] },
      })
      .json<{ ok: boolean; error?: string }>()

    if (!threadResponse.ok) {
      throw new Error(`Slack API error posting thread: ${threadResponse.error}`)
    }
  }
}

export const handler = notifySlack
