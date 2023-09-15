import { Logger } from '@aws-lambda-powertools/logger'
import { Driver } from 'x-ray-crawler'

import { getBrowser } from './browser'
import { WaitForOptions } from 'puppeteer-core'

type XRayPuppeteerOptions = {
  interactWithPage?: (page: any, ctx: any) => Promise<void>
  logger?: Logger
  waitForOptions?: WaitForOptions
}

const xRayPuppeteer = ({
  interactWithPage = async () => {},
  logger,
  waitForOptions,
}: XRayPuppeteerOptions = {}): Driver => {
  return async (ctx, done) => {
    try {
      const browser = await getBrowser({ logger })

      logger?.info('opening page', { url: ctx.url })
      let page = await browser.newPage()
      await page.goto(ctx.url, waitForOptions)

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
