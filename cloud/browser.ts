import { Logger } from '@aws-lambda-powertools/logger'
import chromium from '@sparticuz/chromium'
import puppeteer, { Browser, LaunchOptions } from 'puppeteer-core'

import { LOCAL_CHROMIUM_EXECUTABLE_PATH } from './browser-local-constants'

type InitializationEntry = {
  resolve: (browser: Browser) => void
  reject: (error: unknown) => void
}

const createBrowserSingleton = () => {
  let instance: Browser | undefined
  let isInitializing = false
  const initializationQueue: InitializationEntry[] = []

  const initializeBrowser = async ({ logger }: { logger?: Logger }) => {
    try {
      logger?.info('running locally?', { isLocal: process.env.IS_LOCAL })

      const chromiumOptions = chromium as typeof chromium & {
        defaultViewport?: LaunchOptions['defaultViewport']
        headless?: LaunchOptions['headless']
      }

      const options: LaunchOptions = {
        args: process.env.IS_LOCAL ? [] : chromiumOptions.args,
        defaultViewport: chromiumOptions.defaultViewport,
        executablePath: process.env.IS_LOCAL
          ? LOCAL_CHROMIUM_EXECUTABLE_PATH
          : await chromiumOptions.executablePath(),
        headless: process.env.IS_LOCAL ? false : chromiumOptions.headless,
        acceptInsecureCerts: true,
      }

      logger?.info('launching browser', { options })
      instance = await puppeteer.launch(options)
      logger?.info('browser launched')
    } catch (error) {
      instance = undefined
      throw error
    } finally {
      isInitializing = false

      const pendingRequests = initializationQueue.splice(0)
      pendingRequests.forEach(({ resolve, reject }, index) => {
        logger?.info('settling pending browser initialization request', {
          index,
          hasInstance: Boolean(instance),
        })

        if (instance) {
          resolve(instance)
        } else {
          reject(new Error('browser initialization failed'))
        }
      })
    }
  }

  return async ({ logger }: { logger?: Logger }): Promise<Browser> => {
    if (!instance && !isInitializing) {
      logger?.info('initializing browser')
      isInitializing = true
      await initializeBrowser({ logger })
    }

    if (isInitializing) {
      logger?.info('browser is initializing')
      // If initialization is in progress, return a promise that settles when it's done
      return new Promise<Browser>((resolve, reject) => {
        initializationQueue.push({ resolve, reject })
      })
    } else {
      logger?.info('browser is initialized')
      // If instance is available, return it
      if (!instance) {
        throw new Error('browser failed to initialize')
      }

      return instance
    }
  }
}

export const getBrowser = createBrowserSingleton()

const timeout = (ms: number) =>
  new Promise((resolve, reject) =>
    setTimeout(() => reject(`timeout triggered after ${ms}`), ms),
  )

const closePagesAndBrowser = async ({
  browser,
  logger,
}: {
  browser: Browser
  logger?: Logger
}) => {
  const pages = await browser.pages()
  logger?.info('closing pages', { numberOfPages: pages.length })
  await Promise.all(pages.map((p) => p.close()))

  logger?.info('closing browser')
  await browser.close()
  logger?.info('done closing browser')
}

export const closeBrowser = async ({ logger }: { logger?: Logger }) => {
  const browser = await getBrowser({ logger })

  const connected = browser.isConnected()
  logger?.info('is browser connected', { connected })
  if (connected) {
    logger?.info('closing pages and browser')

    try {
      await Promise.race([
        closePagesAndBrowser({ browser, logger }),
        timeout(10_000),
      ])
    } catch (err) {
      logger?.warn('failed closing browser', { err })
    }
  }
}
