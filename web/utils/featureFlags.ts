export const isEnabled = (flag: string) =>
  new Set((process.env.FEATURE_FLAGS ?? '').split(/\s+/).filter(Boolean)).has(
    flag,
  )

export const STRUCTURED_DATA_FEATURE = 'structured-data'
