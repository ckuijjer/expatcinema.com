import chromium from '@sparticuz/chrome-aws-lambda'
import { Browser, PuppeteerLaunchOptions } from 'puppeteer-core'
import { Logger } from '@aws-lambda-powertools/logger'

let browser: Promise<Browser> | undefined
let isLaunched = false

// launchBrowser returns a Promise of a Puppeteer Browser instance. This makes sure that
// only one browser is launched per Lambda container, while you can still call
// launchBrowser multiple times. Not awaiting in this function makes sure you can
// call it multiple times, and only have it launch the browser once.
export const launchBrowser = async ({ logger }: { logger?: Logger }) => {
  if (isLaunched) {
    logger?.info('browser already launched, returning earlier promise')
    return browser
  }
  isLaunched = true

  const options: PuppeteerLaunchOptions = {
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
  }

  logger?.info('launching puppeteer', { options })
  browser = chromium.puppeteer.launch(options)

  return browser
}

export const closeBrowser = async ({ logger }: { logger?: Logger }) => {
  if (browser !== undefined) {
    const b = await browser

    logger?.info(
      `closing browser, pid: ${b.process()
        ?.pid}, connected: ${b.isConnected()}`,
    )
    await b.close()
  } else {
    logger?.warn('browser already closed, cannot close again')
  }
}
