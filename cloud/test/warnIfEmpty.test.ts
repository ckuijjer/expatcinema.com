import { Logger } from '@aws-lambda-powertools/logger'

import { warnIfEmpty } from '../scrapers/utils/warnIfEmpty'

const makeLogger = () =>
  ({ warn: jest.fn(), info: jest.fn() }) as unknown as Logger & {
    warn: jest.Mock
    info: jest.Mock
  }

describe('warnIfEmpty', () => {
  test('warns when the listing has no items', () => {
    const logger = makeLogger()
    warnIfEmpty(logger, { listed: 0, subtitled: 0, screenings: 0 })
    expect(logger.warn).toHaveBeenCalledTimes(1)
    expect(logger.info).not.toHaveBeenCalled()
  })

  test('only logs info when nothing listed has English subtitles', () => {
    const logger = makeLogger()
    warnIfEmpty(logger, { listed: 40, subtitled: 0, screenings: 0 })
    expect(logger.warn).not.toHaveBeenCalled()
    expect(logger.info).toHaveBeenCalledWith(
      'no items with English subtitles',
      {
        listed: 40,
        subtitled: 0,
        screenings: 0,
      },
    )
  })

  test('warns when items with English subtitles give no screenings', () => {
    const logger = makeLogger()
    warnIfEmpty(logger, { listed: 40, subtitled: 3, screenings: 0 })
    expect(logger.warn).toHaveBeenCalledTimes(1)
  })

  test('logs nothing when there are screenings', () => {
    const logger = makeLogger()
    warnIfEmpty(logger, { listed: 40, subtitled: 3, screenings: 5 })
    expect(logger.warn).not.toHaveBeenCalled()
    expect(logger.info).not.toHaveBeenCalled()
  })
})
