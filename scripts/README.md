# Analyze Screenings

../data/screenings-without-metadata.json and ../data/screenings-with-metadata.json contains information about todays screenings. The one without metadata comes from the scrapers, the one with metadata went through a step of normalization where each screening title has been mapped to a movie title from TMDB.

- `pnpm downloadScreenings` - downloads both files
- `pnpm analyzeScreenings` - playground like script to do one-off analysis on both files
- `pnpm compareScreenings` - compare both files

# Other

- _addScreenings.ts_ and _sort.ts_ have been moved from _cloud/scrapers/utils_. They weren't used in _cloud/_ and moved here _as-is_ mainly for posterity. They're untested
