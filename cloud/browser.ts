import { Logger } from '@aws-lambda-powertools/logger'
import chromium from '@sparticuz/chromium'
import puppeteer, { Browser, LaunchOptions } from 'puppeteer-core'

import { LOCAL_CHROMIUM_EXECUTABLE_PATH } from './browser-local-constants.ts'

const createBrowserSingleton = () => {
  let instance: Browser
  let isInitializing = false
  const initializationQueue = []

  const initializeBrowser = async ({ logger }: { logger?: Logger }) => {
    try {
      logger?.info('running locally?', { isLocal: process.env.IS_LOCAL })

      const options: LaunchOptions = {
        ...(process.env.IS_LOCAL ? {} : chromium.args),
        defaultViewport: chromium.defaultViewport,
        executablePath: process.env.IS_LOCAL
          ? LOCAL_CHROMIUM_EXECUTABLE_PATH
          : await chromium.executablePath(),
        headless: process.env.IS_LOCAL ? false : chromium.headless,
        acceptInsecureCerts: true,
      }

      logger?.info('launching browser', { options })
      instance = await puppeteer.launch(options)
      isInitializing = false
      logger?.info('browser launched')

      // Resolve all pending promises in the queue
      let i = 0
      while (initializationQueue.length) {
        logger?.info(`resolving pending promises in the queue: ${i++}`)
        const resolver = initializationQueue.shift()
        resolver(instance)
      }
    } catch (error) {
      // Reject all pending promises in the queue on error
      let i = 0
      while (initializationQueue.length) {
        logger?.info(`resolving pending promises in the queue: ${i++}`)
        const resolver = initializationQueue.shift()
        resolver(Promise.reject(error))
      }
    }
  }

  return async ({ logger }: { logger?: Logger }): Promise<Browser> => {
    if (!instance && !isInitializing) {
      logger?.info('initializing browser')
      isInitializing = true
      initializeBrowser({ logger })
    }

    if (isInitializing) {
      logger?.info('browser is initializing')
      // If initialization is in progress, return a promise that resolves when it's done
      return new Promise((resolve) => {
        initializationQueue.push(resolve)
      })
    } else {
      logger?.info('browser is initialized')
      // If instance is available, return it
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
