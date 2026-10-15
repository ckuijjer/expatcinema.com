import { retryOnServerError } from '../clients/retryOnServerError'

const answers = (...statusCodes: number[]) => {
  const attempt = jest.fn()
  statusCodes.forEach((statusCode) =>
    attempt.mockResolvedValueOnce({ statusCode }),
  )
  return attempt
}

describe('retryOnServerError', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  const run = async (attempt: jest.Mock, delays?: number[]) => {
    const result = retryOnServerError(attempt, delays)
    await jest.runAllTimersAsync()
    return result
  }

  test('returns a good answer straight away', async () => {
    const attempt = answers(200)

    expect(await run(attempt)).toEqual({ statusCode: 200 })
    expect(attempt).toHaveBeenCalledTimes(1)
  })

  test.each([429, 502, 503, 504])(
    'tries again after a %i and returns the good answer',
    async (status) => {
      const attempt = answers(status, status, 200)

      expect(await run(attempt)).toEqual({ statusCode: 200 })
      expect(attempt).toHaveBeenCalledTimes(3)
    },
  )

  test('gives up after the last delay and returns that answer', async () => {
    const attempt = answers(503, 503, 503, 503, 200)

    expect(await run(attempt)).toEqual({ statusCode: 503 })
    expect(attempt).toHaveBeenCalledTimes(4)
  })

  test.each([200, 301, 403, 404, 500])(
    'does not try again after a %i',
    async (status) => {
      const attempt = answers(status)

      expect(await run(attempt)).toEqual({ statusCode: status })
      expect(attempt).toHaveBeenCalledTimes(1)
    },
  )

  test('waits longer each time, with jitter of at most half either way', async () => {
    const attempt = answers(503, 503, 200)
    const result = retryOnServerError(attempt, [1_000, 2_000])

    await jest.advanceTimersByTimeAsync(0)
    expect(attempt).toHaveBeenCalledTimes(1)
    await jest.advanceTimersByTimeAsync(499) // 500ms at the least
    expect(attempt).toHaveBeenCalledTimes(1)
    await jest.advanceTimersByTimeAsync(1_001) // 1500ms at the most
    expect(attempt).toHaveBeenCalledTimes(2)
    await jest.advanceTimersByTimeAsync(3_000) // 3000ms at the most
    expect(attempt).toHaveBeenCalledTimes(3)
    expect(await result).toEqual({ statusCode: 200 })
  })
})
