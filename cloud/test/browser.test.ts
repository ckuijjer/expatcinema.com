const mockLaunch = jest.fn()

jest.mock('puppeteer-core', () => ({
  __esModule: true,
  default: {
    launch: mockLaunch,
  },
}))

jest.mock('@sparticuz/chromium', () => ({
  __esModule: true,
  default: {
    args: [],
    defaultViewport: undefined,
    headless: true,
    executablePath: jest.fn(),
  },
}))

jest.mock('../browser-local-constants', () => ({
  LOCAL_CHROMIUM_EXECUTABLE_PATH: '/tmp/chromium',
}))

describe('browser singleton', () => {
  beforeEach(() => {
    jest.resetModules()
    mockLaunch.mockReset()
  })

  test('allows a retry after launch failure', async () => {
    const mockBrowser = {
      isConnected: jest.fn().mockReturnValue(true),
      pages: jest.fn().mockResolvedValue([]),
      close: jest.fn().mockResolvedValue(undefined),
    }

    mockLaunch
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(mockBrowser)

    const { getBrowser } = await import('../browser')

    await expect(getBrowser({})).rejects.toThrow('boom')
    await expect(getBrowser({})).resolves.toBe(mockBrowser)
  })
})
