const post = jest.fn()

jest.mock('got', () => ({
  __esModule: true,
  default: { post },
}))

const ORIGINAL_ENV = process.env

const load = async () => await import('../clients/scrapeRelay')

const configure = () => {
  process.env.SCRAPE_RELAY_URL = 'https://relay.example.com/'
  process.env.SCRAPE_RELAY_TOKEN = 'secret-token'
}

const relayReturns = (payload: unknown) =>
  post.mockReturnValue({ json: jest.fn().mockResolvedValue(payload) })

describe('scrape relay client', () => {
  beforeEach(() => {
    jest.resetModules()
    post.mockReset()
    process.env = { ...ORIGINAL_ENV }
    delete process.env.SCRAPE_RELAY_URL
    delete process.env.SCRAPE_RELAY_TOKEN
  })

  afterAll(() => {
    process.env = ORIGINAL_ENV
  })

  describe('shouldRelay', () => {
    test('is false without configuration, whatever the host', async () => {
      const { shouldRelay } = await load()
      expect(shouldRelay('https://www.filmhuisbreda.nl/film-overzicht')).toBe(
        false,
      )
    })

    test('is false when only one of url and token is set', async () => {
      process.env.SCRAPE_RELAY_URL = 'https://relay.example.com'
      const { shouldRelay } = await load()
      expect(shouldRelay('https://www.filmhuisbreda.nl/')).toBe(false)
    })

    test.each([
      'https://www.filmhuisbreda.nl/film-overzicht/alle-films',
      'https://www.heerenstraattheater.nl/subtitlesunday',
      'https://kinepolisweb-programmation.kinepolis.com/api/Programmation/NL/NL/WWW/Cinema/Cinerama',
      'https://WWW.FILMHUISBREDA.NL/x',
    ])('is true for a relayed host: %s', async (url) => {
      configure()
      const { shouldRelay } = await load()
      expect(shouldRelay(url)).toBe(true)
    })

    test.each([
      'https://www.lantarenvenster.nl/',
      'https://filmhuisbreda.nl/', // not the exact hostname
      'https://www.filmhuisbreda.nl.evil.example/',
      'not a url',
    ])('is false for anything else: %s', async (url) => {
      configure()
      const { shouldRelay } = await load()
      expect(shouldRelay(url)).toBe(false)
    })
  })

  describe('relayGet', () => {
    test('posts the url and headers to the relay with basic auth and the token', async () => {
      configure()
      relayReturns({
        status: 200,
        url: 'https://www.filmhuisbreda.nl/x',
        body: '<html></html>',
      })
      const { relayGet } = await load()

      const result = await relayGet('https://www.filmhuisbreda.nl/x', {
        'user-agent': 'test-agent',
      })

      expect(post).toHaveBeenCalledTimes(1)
      const [endpoint, options] = post.mock.calls[0]
      expect(endpoint).toBe('https://relay.example.com/fetch')
      // Pangolin checks the basic auth at the edge, the relay the token itself
      expect(options.headers.authorization).toBe(
        `Basic ${Buffer.from('scrape-relay:secret-token').toString('base64')}`,
      )
      expect(options.headers['x-relay-token']).toBe('secret-token')
      expect(options.json).toEqual({
        url: 'https://www.filmhuisbreda.nl/x',
        headers: { 'user-agent': 'test-agent' },
      })
      expect(result).toEqual({
        statusCode: 200,
        url: 'https://www.filmhuisbreda.nl/x',
        body: '<html></html>',
      })
    })

    test('lets a relay error (e.g. wrong token) throw', async () => {
      configure()
      post.mockReturnValue({
        json: jest.fn().mockRejectedValue(new Error('Response code 401')),
      })
      const { relayGet } = await load()

      await expect(relayGet('https://www.filmhuisbreda.nl/x')).rejects.toThrow(
        'Response code 401',
      )
    })

    test('throws when the relay is not configured', async () => {
      const { relayGet } = await load()
      await expect(relayGet('https://www.filmhuisbreda.nl/x')).rejects.toThrow(
        'not configured',
      )
    })
  })

  describe('relayJson', () => {
    const url = 'https://kinepolisweb-programmation.kinepolis.com/api/x'

    test('parses the upstream body', async () => {
      configure()
      relayReturns({ status: 200, url, body: '{"films":[1,2]}' })
      const { relayJson } = await load()

      expect(await relayJson(url)).toEqual({ films: [1, 2] })
    })

    test('throws on an upstream error status, like got would', async () => {
      configure()
      relayReturns({ status: 403, url, body: '<html>403 Blocked</html>' })
      const { relayJson } = await load()

      await expect(relayJson(url)).rejects.toThrow(
        `Non-ok response retrieving ${url}: 403`,
      )
    })
  })
})
