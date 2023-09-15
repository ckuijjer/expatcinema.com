import chromium from '@sparticuz/chrome-aws-lambda'
import { Browser, PuppeteerLaunchOptions } from 'puppeteer-core'
import { Logger } from '@aws-lambda-powertools/logger'

let browser: Browser | undefined

export const launchBrowser = async ({ logger }: { logger?: Logger }) => {
  if (browser !== undefined) {
    return browser
  }

  const options: PuppeteerLaunchOptions = {
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
  }

  logger?.info('launching puppeteer', { options })
  browser = await chromium.puppeteer.launch(options)

  return browser
}

export const closeBrowser = async ({ logger }: { logger?: Logger }) => {
  if (browser !== undefined) {
    logger?.info(
      `closing browser, pid: ${browser.process()
        ?.pid}, connected: ${browser.isConnected()}`,
    )
    await browser.close()
  } else {
    logger?.warn('browser already closed, cannot close again')
  }
}
