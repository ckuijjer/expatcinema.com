const chromium = require('chrome-aws-lambda')

const xRayPuppeteer = () => {
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

module.exports = xRayPuppeteer
