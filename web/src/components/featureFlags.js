export const isEnabled = (flag) =>
  new Set(
    (process.env.GATSBY_FEATURE_FLAGS ?? '').split(/\s+/).filter((x) => x),
  ).has(flag)
