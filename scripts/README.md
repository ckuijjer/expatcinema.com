# Analyze Screenings

`../data/screenings/screenings.json` contains the enriched public screenings output.
`../data/screenings/movies.json` contains the canonical movie index keyed by stable movie ids.

- `pnpm downloadScreenings` - downloads both files
- `pnpm analyzeScreenings` - playground-like script to do one-off analysis on `screenings.json`

# Other

- _addScreenings.ts_ and _sort.ts_ have been moved from _cloud/scrapers/utils_. They weren't used in _cloud/_ and moved here _as-is_ mainly for posterity. They're untested
