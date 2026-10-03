import { withTimeout } from '../scrapers/utils/withTimeout'

describe('withTimeout', () => {
  test('resolves with the value when the promise settles in time', async () => {
    await expect(withTimeout(Promise.resolve(42), 1000, 'x')).resolves.toBe(42)
  })

  test('rejects with the original error when the promise rejects in time', async () => {
    await expect(
      withTimeout(Promise.reject(new Error('boom')), 1000, 'x'),
    ).rejects.toThrow('boom')
  })

  test('rejects when the promise takes too long', async () => {
    const never = new Promise<number>(() => {})

    await expect(withTimeout(never, 20, 'scraper foo')).rejects.toThrow(
      'scraper foo timed out after 20 ms',
    )
  })
})
