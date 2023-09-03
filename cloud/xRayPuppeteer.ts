import chromium from '@sparticuz/chrome-aws-lambda'
import { Browser, PuppeteerLaunchOptions } from 'puppeteer-core'
import { Logger } from '@aws-lambda-powertools/logger'
import { Driver } from 'x-ray-crawler'

type XRayPuppeteerOptions = {
  interactWithPage?: (page: any, ctx: any) => Promise<void>
  logger?: Logger
}

let _browser: Browser | undefined

const launchBrowser = async ({ logger }: { logger?: Logger }) => {
  if (_browser !== undefined) {
    return _browser
  }

  const options: PuppeteerLaunchOptions = {
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
  }

  logger?.info('launching puppeteer', { options })
  _browser = await chromium.puppeteer.launch(options)

  return _browser
}

export const closeBrowser = ({ logger }: { logger?: Logger }) => {
  if (_browser !== undefined) {
    logger?.info('closing browser')
    _browser.close()
  }
}

const xRayPuppeteer = ({
  interactWithPage = async () => {},
  logger,
}: XRayPuppeteerOptions = {}): Driver => {
  return async (ctx, done) => {
    try {
      const browser = await launchBrowser({ logger })

      logger?.info('opening page', { url: ctx.url })
      let page = await browser.newPage()
      await page.goto(ctx.url)

      if (interactWithPage) {
        await interactWithPage(page, ctx)
      }

      if (!ctx.body) {
        ctx.body = await page.content()
      }
      logger?.info('done retrieving content', { url: ctx.url })
      done(null, ctx)
    } catch (error) {
      logger?.error('error retrieving', { url: ctx.url, error })
      return done(error, null)
    }
  }
}

export default xRayPuppeteer
