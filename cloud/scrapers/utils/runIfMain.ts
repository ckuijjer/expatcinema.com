export const runIfMain = (
  fn: () => Promise<unknown>,
  metaUrl: string,
): void => {
  if (
    (typeof module === 'undefined' || module.exports === undefined) && // running in ESM
    metaUrl === new URL(metaUrl).href // running as main module, not importing from another module
  ) {
    // Exit explicitly: a scraper that launched Chromium would otherwise keep the
    // process alive. Puppeteer kills the browser it launched on exit.
    fn()
      .then((x) => console.log(JSON.stringify(x, null, 2)))
      .then(
        () => process.exit(0),
        (error) => {
          console.error(error)
          process.exit(1)
        },
      )
  }
}
