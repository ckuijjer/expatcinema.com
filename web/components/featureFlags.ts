export const isEnabled = (flag) =>
  new Set(
    (process.env.NEXT_PUBLIC_FEATURE_FLAGS ?? '').split(/\s+/).filter((x) => x),
  ).has(flag)
