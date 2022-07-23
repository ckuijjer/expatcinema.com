import chromium from '@sparticuz/chrome-aws-lambda'

const xRayPuppeteer = ({ interactWithPage = async () => {} } = {}) => {
  return async (ctx, done) => {
    let browser = null

    try {
      browser = await chromium.puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath,
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
      })

      let page = await browser.newPage()
      await page.goto(ctx.url)

      if (interactWithPage) {
        await interactWithPage(page, ctx)
      }

      if (!ctx.body) {
        ctx.body = await page.content()
      }
      done(null, ctx)
    } catch (err) {
      return done(err, null)
    } finally {
      if (browser !== null) {
        await browser.close()
      }
    }
  }
}

export default xRayPuppeteer
