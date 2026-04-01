export const isEnabled = (flag: string) =>
  new Set(
    (process.env.NEXT_PUBLIC_FEATURE_FLAGS ?? '').split(/\s+/).filter((x) => x),
  ).has(flag)

// When true, the cinema filter bar is shown on the "All cities" page as well.
// When false (default), it only appears when a specific city is selected.
export const SHOW_CINEMA_FILTER_ON_ALL_CITIES = false
