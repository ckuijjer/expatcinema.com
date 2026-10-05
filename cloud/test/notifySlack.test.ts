import { gzipSync } from 'zlib'

import got from 'got'

import { getSlackMessage, handler } from '../notifySlack'

jest.mock('got')

const post = jest.mocked(got.post)

const logEvent = (message: object) => ({ message: JSON.stringify(message) })

const cloudWatchEvent = (messages: object[]) => ({
  awslogs: {
    data: gzipSync(
      JSON.stringify({ logEvents: messages.map(logEvent) }),
    ).toString('base64'),
  },
})

describe('getSlackMessage', () => {
  test('keeps the thread block under the 3000 characters Slack allows', () => {
    const { threadBlock } = getSlackMessage(
      logEvent({
        level: 'WARN',
        message: 'failed to fetch cms film year',
        scraper: 'kriterion',
        error: { stack: 'x'.repeat(5000) },
      }),
    )

    expect(threadBlock?.text.text.length).toBeLessThan(3000)
    expect(threadBlock?.text.text).toContain('… truncated')
  })

  test('leaves a short thread block as it is', () => {
    const { threadBlock } = getSlackMessage(
      logEvent({ level: 'WARN', message: 'short', scraper: 'lux' }),
    )

    expect(threadBlock?.text.text).not.toContain('truncated')
  })
})

describe('handler', () => {
  beforeEach(() => {
    process.env.SLACK_BOT_TOKEN = 'token'
    process.env.SLACK_CHANNEL = 'channel'
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
    post.mockReset()
  })

  test('does not throw when one post fails, so Lambda does not retry the batch', async () => {
    const json = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, error: 'invalid_blocks' })
      .mockResolvedValue({ ok: true, ts: '1' })
    post.mockReturnValue({ json } as never)

    await expect(
      handler(
        cloudWatchEvent([
          { level: 'WARN', message: 'one', scraper: 'a' },
          { level: 'WARN', message: 'two', scraper: 'b' },
        ]),
      ),
    ).resolves.toBeUndefined()

    expect(console.error).toHaveBeenCalledTimes(1)
  })
})
