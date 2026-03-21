export const runIfMain = (
  fn: () => Promise<unknown>,
  metaUrl: string,
): void => {
  if (
    (typeof module === 'undefined' || module.exports === undefined) && // running in ESM
    metaUrl === new URL(metaUrl).href // running as main module, not importing from another module
  ) {
    fn()
      .then((x) => JSON.stringify(x, null, 2))
      .then(console.log)
  }
}
