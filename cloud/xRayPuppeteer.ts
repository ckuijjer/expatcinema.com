import { Logger } from '@aws-lambda-powertools/logger'
import { WaitForOptions } from 'puppeteer-core'
import { type Driver, type DriverContext } from 'x-ray-crawler'
import type { Page } from 'puppeteer-core'

import { getBrowser } from './browser'

type XRayPuppeteerOptions = {
  interactWithPage?: (page: Page, ctx: DriverContext) => Promise<void>
  // Some sites' bot protection (e.g. Bunny Shield) blocks the default
  // 'HeadlessChrome' user agent; this presents the same browser as regular Chrome
  hideHeadlessUserAgent?: boolean
  logger?: Logger
  waitForOptions?: WaitForOptions
}

const xRayPuppeteer = ({
  interactWithPage = async () => {},
  hideHeadlessUserAgent = false,
  logger,
  waitForOptions,
}: XRayPuppeteerOptions = {}): Driver => {
  return async (ctx: DriverContext, done) => {
    try {
      const browser = await getBrowser({ logger })

      logger?.debug('opening page', { url: ctx.url })
      let page = await browser.newPage()
      if (hideHeadlessUserAgent) {
        const userAgent = await browser.userAgent()
        await page.setUserAgent(userAgent.replace('HeadlessChrome', 'Chrome'))
        await page.setExtraHTTPHeaders({ 'Accept-Language': 'nl,en;q=0.8' })
      }
      await page.goto(String(ctx.url), waitForOptions)

      if (interactWithPage) {
        await interactWithPage(page, ctx)
      }

      if (!ctx.body) {
        ctx.body = await page.content()
      }
      logger?.debug('done retrieving content', { url: ctx.url })

      logger?.debug('closing page', { url: ctx.url })
      await page.close()
      logger?.debug('closed page', { url: ctx.url })

      done(null, ctx)
    } catch (error) {
      logger?.warn('error retrieving', { url: ctx.url, error })
      return done(error, null)
    }
  }
}

export default xRayPuppeteer
