import chromium from '@sparticuz/chrome-aws-lambda'
import { Browser, PuppeteerLaunchOptions } from 'puppeteer-core'
import { Logger } from '@aws-lambda-powertools/logger'

type XRayPuppeteerOptions = {
  interactWithPage?: (page: any, ctx: any) => Promise<void>
  logger?: Logger
}

const xRayPuppeteer = ({
  interactWithPage = async () => {},
  logger,
}: XRayPuppeteerOptions = {}) => {
  return async (ctx, done) => {
    let browser = null
    try {
      const options: PuppeteerLaunchOptions = {
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath,
        headless: true, //chromium.headless,
        ignoreHTTPSErrors: true,
      }

      logger?.info('launching puppeteer', { options })
      browser = await chromium.puppeteer.launch(options)

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
      logger?.error('error retrieving', { url: ctx.url })
      return done(error, null)
    } finally {
      logger?.info('closing browser')
      if (browser !== null) {
        await browser.close()
      }
    }
  }
}

export default xRayPuppeteer
