import chromium from '@sparticuz/chrome-aws-lambda'
import { Browser, PuppeteerLaunchOptions } from 'puppeteer-core'
import { Logger } from '@aws-lambda-powertools/logger'

const createBrowserSingleton = () => {
  let instance: Browser
  let isInitializing = false
  const initializationQueue = []

  const initializeBrowser = async ({ logger }: { logger?: Logger }) => {
    try {
      const options: PuppeteerLaunchOptions = {
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath,
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
      }

      logger?.info('launching browser', { options })
      instance = await chromium.puppeteer.launch(options)
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

export const closeBrowser = async ({ logger }: { logger?: Logger }) => {
  const browser = await getBrowser({ logger })

  const connected = browser.isConnected()
  logger?.info('is browser connected', { connected })
  if (connected) {
    const pages = await browser.pages()
    logger?.info('closing pages', { numberOfPages: pages.length })
    await Promise.all(pages.map((p) => p.close()))

    logger?.info('closing browser')
    await browser.close()
    logger?.info('done closing browser')
  }
}
