import { createServer, Server } from 'node:http'
import { AddressInfo } from 'node:net'

import { createCookieJar, createXray } from '../xRay'

describe('createCookieJar', () => {
  test('sends back a cookie the host set, without its attributes', async () => {
    const jar = createCookieJar()

    await jar.setCookie(
      'csq_token=abc.def; Path=/; Domain=www.natlab.nl; Max-Age=43200; HttpOnly',
      'https://www.natlab.nl/csq/',
    )
    await jar.setCookie(
      'server=queue-app00d; path=/',
      'https://www.natlab.nl/csq/',
    )

    await expect(jar.getCookieString('https://www.natlab.nl/')).resolves.toBe(
      'csq_token=abc.def; server=queue-app00d',
    )
  })

  test('replaces a cookie with the same name', async () => {
    const jar = createCookieJar()

    await jar.setCookie('a=1', 'https://example.nl/')
    await jar.setCookie('a=2', 'https://example.nl/')

    await expect(jar.getCookieString('https://example.nl/')).resolves.toBe(
      'a=2',
    )
  })

  test('keeps the cookies of one host from another host', async () => {
    const jar = createCookieJar()

    await jar.setCookie('a=1', 'https://example.nl/')

    await expect(jar.getCookieString('https://other.nl/')).resolves.toBe('')
  })

  test('ignores a cookie without a name or a value separator', async () => {
    const jar = createCookieJar()

    await jar.setCookie('garbage', 'https://example.nl/')
    await jar.setCookie('=value', 'https://example.nl/')

    await expect(jar.getCookieString('https://example.nl/')).resolves.toBe('')
  })
})

// natlab.nl: / has no token -> 307 /csq/, which sets the token and sends you
// back to / (308), which loops forever when the token cookie is not sent back
describe('a site with a cookie gate', () => {
  let server: Server
  let url: string

  beforeAll(async () => {
    server = createServer((request, response) => {
      const hasToken = /(^|; )csq_token=ok(;|$)/.test(
        request.headers.cookie ?? '',
      )

      if (request.url === '/csq/') {
        response.writeHead(308, {
          location: '/',
          'set-cookie': 'csq_token=ok; Path=/; HttpOnly',
        })
      } else if (!hasToken) {
        response.writeHead(307, { location: '/csq/' })
      } else {
        response.writeHead(200, { 'content-type': 'text/html' })
        response.write('<html><body><h1>Programma</h1></body></html>')
      }
      response.end()
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`
  })

  afterAll(() => new Promise((resolve) => server.close(resolve)))

  // x-ray's call returns a thenable function, which an async function unwraps
  const readHeading = async (xray: ReturnType<typeof createXray>) =>
    xray(url, 'h1')

  test('is read when the cookies are sent back', async () => {
    await expect(readHeading(createXray({ cookies: true }))).resolves.toBe(
      'Programma',
    )
  })

  test('loops on the redirects without cookies', async () => {
    await expect(readHeading(createXray())).rejects.toThrow(/redirect/i)
  })
})
