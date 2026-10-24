import { mkdir, writeFile } from 'fs/promises'

import documentClient from '../documentClient'
import { createPublisher } from '../pipeline/publish'
import { triggerWebDeploy } from '../triggerWebDeploy'

const send = jest.fn()

jest.mock('fs/promises', () => ({
  mkdir: jest.fn(),
  writeFile: jest.fn(),
}))
jest.mock('../documentClient', () => ({
  __esModule: true,
  default: { send: jest.fn() },
}))
jest.mock('../triggerWebDeploy', () => ({ triggerWebDeploy: jest.fn() }))
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(() => ({ send })),
  PutObjectCommand: jest.fn((input) => ({ input })),
}))
jest.mock('@aws-sdk/lib-dynamodb', () => ({
  PutCommand: jest.fn((input) => ({ input })),
}))

const output = {
  resultsPerScraper: {
    lab111: [
      {
        title: 'Cure',
        url: 'https://example.com/cure',
        cinema: 'Lab111',
        date: new Date('2026-10-31T17:40:00Z'),
      },
    ],
  },
  allRawScreenings: [
    {
      title: 'Cure',
      url: 'https://example.com/cure',
      cinema: 'Lab111',
      date: new Date('2026-10-31T17:40:00Z'),
    },
  ],
  resolved: {
    screenings: [
      {
        title: 'Cure',
        url: 'https://example.com/cure',
        cinema: 'Lab111',
        date: new Date('2026-10-31T17:40:00Z'),
        movieId: 'tmdb:36095',
      },
    ],
    movies: [],
    titleMatches: [],
    review: { ambiguous: [], unmatched: [], directorDisagreements: [] },
  },
} as unknown as Parameters<ReturnType<typeof createPublisher>>[0]

describe('createPublisher', () => {
  const env = { ...process.env }

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.PRIVATE_BUCKET = 'private-bucket'
    process.env.PUBLIC_BUCKET = 'public-bucket'
    process.env.DYNAMODB_ANALYTICS = 'analytics-table'
  })

  afterEach(() => {
    process.env = { ...env }
  })

  test('needs both buckets', () => {
    delete process.env.PUBLIC_BUCKET

    expect(() => createPublisher()).toThrow(
      'PRIVATE_BUCKET and PUBLIC_BUCKET must be set',
    )
  })

  describe('locally', () => {
    beforeEach(() => {
      process.env.IS_LOCAL = 'true'
    })

    test('writes every file to ./output, and no deploy', async () => {
      await createPublisher()(output)

      const written = (writeFile as jest.Mock).mock.calls.map(([path]) =>
        String(path).replace(/\/\d{4}-[^/]*\.json$/, '/<now>.json'),
      )

      expect(written.sort()).toEqual(
        [
          './output/private-bucket/all/<now>.json',
          './output/private-bucket/lab111/<now>.json',
          './output/private-bucket/review/ambiguous-movies/<now>.json',
          './output/private-bucket/review/unmatched-movies/<now>.json',
          './output/private-bucket/review/director-disagreements/<now>.json',
          './output/public-bucket/screenings.json',
          './output/public-bucket/movies.json',
          './output/public-bucket/title-matches.json',
          './output/analytics/count.json',
        ].sort(),
      )
      expect(mkdir).toHaveBeenCalled()
      expect(send).not.toHaveBeenCalled()
      expect(triggerWebDeploy).not.toHaveBeenCalled()
    })

    test('names the files of every run after the time of that run, not of the first', async () => {
      jest.useFakeTimers()
      try {
        const publish = createPublisher()

        jest.setSystemTime(new Date('2026-01-01T10:00:00Z'))
        await publish(output)
        jest.setSystemTime(new Date('2026-01-01T11:00:00Z'))
        await publish(output)
      } finally {
        jest.useRealTimers()
      }

      const paths = (writeFile as jest.Mock).mock.calls.map(([path]) =>
        String(path),
      )

      expect(paths).toContain(
        './output/private-bucket/all/2026-01-01T10:00:00.000Z.json',
      )
      expect(paths).toContain(
        './output/private-bucket/all/2026-01-01T11:00:00.000Z.json',
      )
    })

    test('counts the screenings per scraper and with a movie', async () => {
      await createPublisher()(output)

      const [, json] = (writeFile as jest.Mock).mock.calls.find(([path]) =>
        String(path).endsWith('analytics/count.json'),
      )

      expect(JSON.parse(json)).toEqual({ lab111: 1, all: 1, allWithMovieId: 1 })
    })
  })

  describe('on AWS', () => {
    beforeEach(() => {
      delete process.env.IS_LOCAL
    })

    test('puts the files in the buckets, the counts in the analytics, and has the web deployed', async () => {
      await createPublisher()(output)

      const keys = send.mock.calls.map(
        ([command]) => `${command.input.Bucket}/${command.input.Key}`,
      )

      expect(keys).toEqual(
        expect.arrayContaining([
          'public-bucket/screenings.json',
          'public-bucket/movies.json',
          'public-bucket/title-matches.json',
        ]),
      )
      expect(
        keys.filter((key) => key.startsWith('private-bucket/')),
      ).toHaveLength(5)
      expect(documentClient.send).toHaveBeenCalledTimes(1)
      expect(triggerWebDeploy).toHaveBeenCalledTimes(1)
      expect(writeFile).not.toHaveBeenCalled()
    })
  })
})
