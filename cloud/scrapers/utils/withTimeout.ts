/**
 * Rejects when `promise` hasn't settled within `ms`, so one stuck scraper
 * can't keep the whole Lambda busy until it is killed by its own timeout (which
 * throws away the results of every other scraper too).
 *
 * The underlying work isn't cancelled, it is only no longer waited for.
 */
export const withTimeout = async <T>(
  promise: Promise<T>,
  ms: number,
  description: string,
): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${description} timed out after ${ms} ms`)),
          ms,
        )
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}
