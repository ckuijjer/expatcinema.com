# Expat Cinema - AI Assistant Guide

## Session Setup

**Always run `nvm use` at the start of every session** to activate Node 22 (as specified in `.nvmrc`). This ensures the correct Node version is used for all commands.

```bash
nvm use
```

## Project Overview

Expat Cinema is a movie screening aggregator for foreign films with English subtitles in Dutch cinemas. The system scrapes cinema websites, enriches movie metadata, and presents the data through a Next.js static website.

**Live site:** https://expatcinema.com

## Repository Architecture

This is a **pnpm monorepo** with four packages:

```
expatcinema.com/
├── cloud/          # AWS infrastructure with Lambda scrapers
├── web/            # Next.js static site (GitHub Pages)
├── scripts/        # Data analysis utilities
├── backend/        # (Package defined but minimal usage)
└── data/           # Local data storage (gitignored)
```

### Technology Stack

**Cloud (Backend)**

- **Runtime:** Node.js 22 (AWS Lambda)
- **Infrastructure:** AWS CDK (TypeScript)
- **Storage:** S3 (data), DynamoDB (metadata cache, analytics)
- **Web Scraping:** Puppeteer (headless Chrome), got (HTTP), x-ray (HTML parsing)
- **Bundling:** esbuild via AWS CDK
- **Testing:** Jest with ts-jest
- **Key Libraries:** luxon (dates), diacritics (text normalization), p-map (concurrency)

**Web (Frontend)**

- **Framework:** Next.js 15 with static export (`output: 'export'`)
- **Styling:** Emotion (CSS-in-JS)
- **UI:** React 19 with react-virtualized for performance
- **Visualization:** Observable Plot
- **Deployment:** GitHub Pages (gh-pages branch)

**Development Tools**

- **Package Manager:** pnpm 9.15.4 (defined in packageManager field)
- **Node Version:** 22 (see .nvmrc)
- **TypeScript:** 5.8.2
- **Code Formatting:** Prettier with import sorting plugin
- **CI/CD:** GitHub Actions

## Core Data Model

### Screening Type

```typescript
type Screening = {
  title: string // Movie title (cleaned, normalized)
  url: string // Link to cinema's screening page
  cinema: string // Cinema name
  date: Date // Screening datetime (Europe/Amsterdam timezone)
}
```

All scrapers must return `Promise<Screening[]>`.

## Development Workflows

### Initial Setup

```bash
# Install dependencies
pnpm install

# Install Chromium for Puppeteer-based scrapers
cd cloud && pnpm run install-chromium

# Verify Chromium installation
pnpm run open-chromium
```

### Working with Scrapers

#### Running Scrapers Locally

```bash
cd cloud

# Run all scrapers on dev stage
AWS_PROFILE=casper pnpm run scrapers

# Run all scrapers on prod stage
AWS_PROFILE=casper pnpm run scrapers:prod

# Run specific scrapers (set in .env)
SCRAPERS=kinorotterdam,eyefilm pnpm run scrapers

# Test a single scraper with debug logging
LOG_LEVEL=debug pnpm tsx scrapers/kinorotterdam.ts
```

#### Adding a New Cinema Scraper

1. **Create scraper file:** `cloud/scrapers/newcinema.ts`

   ```typescript
   import { logger as parentLogger } from '../powertools'
   import { Screening } from '../types'

   const logger = parentLogger.createChild({
     persistentLogAttributes: { scraper: 'newcinema' },
   })

   const extractFromMainPage = async (): Promise<Screening[]> => {
     // Scraper implementation
     return screenings
   }

   export default extractFromMainPage
   ```

2. **Import in index:** Add to `cloud/scrapers/index.ts`

   ```typescript
   import newcinema from './newcinema'

   const SCRAPERS = {
     // ... existing scrapers
     newcinema,
   }
   ```

3. **Test locally:**

   ```bash
   LOG_LEVEL=debug pnpm tsx scrapers/newcinema.ts
   ```

4. **Deploy:**
   ```bash
   pnpm run deploy
   ```

#### Scraper Patterns

**HTTP-based scraper (most common):**

```typescript
import got from 'got'

import { Screening } from '../types'

const extractFromMainPage = async (): Promise<Screening[]> => {
  const data = await got('https://cinema.com/api').json()
  // Process data
  return screenings
}

export default extractFromMainPage
```

**Puppeteer-based scraper (for JavaScript-heavy sites):**

```typescript
import { getBrowser } from '../browser'
import { Screening } from '../types'

const extractFromMainPage = async (): Promise<Screening[]> => {
  const browser = await getBrowser()
  const page = await browser.newPage()
  await page.goto('https://cinema.com/program')
  // Scrape with Puppeteer
  return screenings
}

export default extractFromMainPage
```

**Note:** Puppeteer scrapers require Chrome Lambda layer (auto-configured in CDK).

### Working with Cloud Infrastructure

#### Local Development

```bash
cd cloud

# Deploy to dev stage with hot-swapping
AWS_PROFILE=casper STAGE=dev pnpm run deploy

# Watch for changes and auto-deploy
AWS_PROFILE=casper STAGE=dev pnpm run watch

# Synthesize CloudFormation template
AWS_PROFILE=casper STAGE=dev pnpm run synth

# View Lambda configuration
pnpm run config:scrapers
```

#### Environment Variables

**Local development:** Use `.env` file in `cloud/` (not committed):

```bash
TMDB_API_KEY=xxx
OMDB_API_KEY=xxx
SLACK_WEBHOOK=xxx
GOOGLE_CUSTOM_SEARCH_ID=xxx
GOOGLE_CUSTOM_SEARCH_API_KEY=xxx
SCRAPEOPS_API_KEY=xxx
SCRAPERS=kinorotterdam,eyefilm  # Optional: limit scrapers
```

**CI/CD:** Set in GitHub Secrets (Repository Settings → Secrets and Variables → Actions)

#### Deployment Stages

- **dev:** Local development stage, manually deployed
- **prod:** Production stage, auto-deployed via GitHub Actions on push to `main`

### Working with Web Application

```bash
cd web

# Development server with Turbopack
pnpm dev --turbopack

# Build static site
pnpm build

# Preview production build
pnpm start

# Clean build artifacts
pnpm clean
```

#### Web Data Flow

1. **Build time:** Next.js fetches `screenings.json` from S3 public bucket
2. **Static generation:** All pages pre-rendered to HTML
3. **Deploy:** Output directory (`out/`) deployed to GitHub Pages
4. **Schedule:** Automatic rebuild daily at 3:30 UTC to get latest screenings

### Monitoring and Debugging

```bash
cd cloud

# Tail CloudWatch logs with prettified JSON
pnpm run log

# Run playground Lambda (for testing)
pnpm run playground
```

## Project-Specific Conventions

### Code Style

**Prettier configuration:**

- No semicolons
- Single quotes
- Import sorting (third-party first, then relative)
- Automatic import grouping with blank lines

**Run formatter:**

```bash
pnpm format  # From root, formats entire repo
```

### Naming Conventions

- **Files:** camelCase for TypeScript files (e.g., `kinorotterdam.ts`)
- **Scrapers:** Match cinema name, lowercase (e.g., `eyefilm`, `kinorotterdam`)
- **Functions:** camelCase (e.g., `extractFromMainPage`, `hasEnglishSubtitles`)
- **Types:** PascalCase (e.g., `Screening`, `BackendStackProps`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `SCRAPERS`, `PUBLIC_BUCKET`)

### Common Utility Functions

Located in `cloud/scrapers/utils/`:

- `titleCase(str)` - Capitalize first letter of each word
- `removeYearSuffix(str)` - Remove year from movie title
- `makeScreeningsUniqueAndSorted(screenings)` - Deduplicate and sort by date
- `guessYear(monthName)` - Infer year from month name
- `monthToNumber(monthName)` - Convert month name to number

### Logging Best Practices

```typescript
import { logger as parentLogger } from '../powertools'

const logger = parentLogger.createChild({
  persistentLogAttributes: { scraper: 'cinemaname' },
})

// Info logging
logger.info('Extracted screenings', { count: screenings.length })

// Debug logging (only visible with LOG_LEVEL=debug)
logger.debug('API response', { data })

// Error logging
logger.error('Failed to fetch', { error })
```

### Date Handling

**Always use luxon with Europe/Amsterdam timezone:**

```typescript
import { DateTime, Settings } from 'luxon'

// Timezone is set in scrapers/index.ts
Settings.defaultZone = 'Europe/Amsterdam'

// Parse dates
const date = DateTime.fromFormat('2024-01-15 20:00', 'yyyy-MM-dd HH:mm')

// Convert to JS Date for Screening type
const screening: Screening = {
  // ...
  date: date.toJSDate(),
}
```

## Data Processing Pipeline

1. **Scraping** → Individual cinema scrapers extract raw data
2. **Aggregation** → `scrapers/index.ts` combines all scrapers
3. **Normalization** → Titles cleaned (diacritics removed, titleCase, year suffix removed)
4. **Metadata Enrichment** → TMDB/OMDB APIs add movie details
5. **Storage** →
   - Raw output: `s3://expatcinema-scrapers-output-{stage}/`
   - Public data: `s3://expatcinema-public-{stage}/screenings.json`
   - Metadata cache: DynamoDB table `expatcinema-scrapers-movie-metadata-{stage}`
   - Analytics: DynamoDB table `expatcinema-scrapers-analytics-{stage}`
6. **Web Build** → Next.js fetches public S3 data at build time
7. **Deployment** → Static site deployed to GitHub Pages

## GitHub Actions Workflows

### Cloud Deployment (`.github/workflows/cloud.yml`)

**Triggers:**

- Push to `main` branch (paths: `cloud/**`, `.github/workflows/cloud.yml`)
- Manual dispatch

**Actions:**

1. Install dependencies
2. Configure AWS credentials
3. CDK bootstrap
4. CDK deploy to prod stage

### Web Deployment (`.github/workflows/web.yml`)

**Triggers:**

- Push to `main` branch (paths: `web/**`, `.github/workflows/web.yml`)
- Daily schedule at 3:30 UTC
- Manual dispatch

**Actions:**

1. Install dependencies
2. Build Next.js static site
3. Generate sitemap
4. Deploy to GitHub Pages

## AWS Infrastructure

### Lambda Functions

**Scrapers Lambda:**

- **Name:** `expatcinema-{stage}-scrapers`
- **Runtime:** Node.js 22, x86_64
- **Memory:** 1024 MB
- **Timeout:** 1 minute (configurable per function)
- **Layers:** Chrome AWS Lambda layer (for Puppeteer)
- **Schedule:** Daily via EventBridge cron
- **Environment:** All API keys and configuration

**Playground Lambda:**

- **Name:** `expatcinema-{stage}-playground`
- **Purpose:** Testing and experimentation
- **Config:** Similar to scrapers

### S3 Buckets

- `expatcinema-scrapers-output-{stage}` - Raw scraper outputs (private)
- `expatcinema-public-{stage}` - Processed data for web consumption (public read)

### DynamoDB Tables

- `expatcinema-scrapers-analytics-{stage}` - Scraper run analytics
- `expatcinema-scrapers-movie-metadata-{stage}` - TMDB/OMDB metadata cache

## Testing

### Unit Tests

```bash
cd cloud
pnpm test
```

**Test location:** `cloud/test/*.test.ts`
**Configuration:** `cloud/jest.config.cjs` (must be `.cjs`, not `.js`, because `cloud/package.json` has `"type": "module"`)

### Manual Testing Checklist

When adding/modifying scrapers:

1. ✅ Test scraper locally with debug logging
2. ✅ Verify screenings have English subtitles
3. ✅ Check title normalization (no years, proper case)
4. ✅ Validate dates are in Europe/Amsterdam timezone
5. ✅ Ensure URLs are absolute and valid
6. ✅ **Find a film with multiple screenings on different dates — verify each screening has a distinct, correct date** (not all the same date)
7. ✅ Deploy to dev stage and run integration test
8. ✅ Check CloudWatch logs for errors
9. ✅ Verify output in S3 bucket: check total screening count and spot-check a few films with multiple dates

## Common Tasks

### Backup and Restore Data

**Backup S3 and DynamoDB:**

```bash
cd backup/
export STAGE=prod
aws s3 sync s3://expatcinema-scrapers-output-$STAGE expatcinema-scrapers-output-$STAGE --profile casper
aws s3 sync s3://expatcinema-public-$STAGE expatcinema-public-$STAGE --profile casper
aws dynamodb scan --table-name expatcinema-scrapers-analytics-$STAGE --profile casper > analytics-$STAGE.json
aws dynamodb scan --table-name expatcinema-scrapers-movie-metadata-$STAGE --profile casper > metadata-$STAGE.json
```

**Restore:**

```bash
aws s3 sync expatcinema-scrapers-output-$STAGE s3://expatcinema-scrapers-output-$STAGE --profile casper
aws s3 sync expatcinema-public-$STAGE s3://expatcinema-public-$STAGE --profile casper
# DynamoDB restore: use put-item for each record (see README for full script)
```

### Upgrading Puppeteer and Chromium

1. Check compatibility at https://pptr.dev/supported-browsers
2. Verify Chromium version at https://github.com/Sparticuz/chromium
3. Check Lambda layer at https://github.com/shelfio/chrome-aws-lambda-layer
4. Update packages:
   ```bash
   cd cloud
   pnpm add puppeteer-core@X.X.X @sparticuz/chromium@^XXX.X.X
   pnpm add -D puppeteer@X.X.X
   ```
5. Update Lambda layer ARN in `cloud/lib/backend-stack.ts`
6. Reinstall local Chromium: `pnpm run install-chromium`

### Analyzing Screening Data

```bash
cd scripts

# Download latest screening data from S3
pnpm downloadScreenings

# Run analysis scripts
pnpm analyzeScreenings

# Compare screening datasets
pnpm compareScreenings
```

## Troubleshooting

### Puppeteer "Chromium ENOENT" Error

**Problem:** Local Chromium not found

**Solution:**

```bash
cd cloud
pnpm run install-chromium
```

This installs Chromium and updates `browser-local-constants.ts` with the correct path.

### Lambda Timeout on Puppeteer Scrapers

**Problem:** Scraper exceeds 1-minute timeout

**Solutions:**

1. Increase timeout in `cloud/lib/backend-stack.ts`
2. Optimize scraper (reduce navigation, use waitForSelector efficiently)
3. Ensure browser is properly closed with `closeBrowser()`

### Environment Variables Not Available in Lambda

**Problem:** API keys not set

**Solution:**

- Local: Add to `cloud/.env`
- Prod: Add to GitHub Secrets (must trigger new deployment)

### Web Build Failing

**Problem:** Next.js build errors

**Common causes:**

1. Can't fetch screenings.json from S3 (check public bucket permissions)
2. TypeScript errors (run `pnpm type-check` in web/)
3. Out of memory (increase GitHub Actions runner memory)

### Scrapers Not Returning English Subtitles

**Problem:** Non-English screenings included

**Solution:**

- Add filtering logic: `filter((screening) => hasEnglishSubtitles(screening))`
- Check cinema's API/HTML for subtitle indicators
- Look for tags like "EN subs", "OV", "Engels ondertiteld"

### Silent Data Corruption: Wrong Dates on Multi-Date Films

**Problem:** Scraper returns screenings with no errors, but multiple screenings for the same film all have the same (wrong) date.

**Cause:** A CSS selector matches an outer wrapper element instead of individual row elements. For example, `#voorstellingen > .wp-block-group` may match the single wrapper div that contains all rows, causing all time elements inside to be collected under only the first date found.

**Solution:** Use `:has(> .child)` to target only elements that directly contain the expected child — this skips outer wrappers:

```typescript
// Wrong: may match outer wrapper containing all rows
$('#voorstellingen > .wp-block-group')

// Correct: matches only row-level elements that directly contain .datum-tekst
$('#voorstellingen .wp-block-group:has(> .datum-tekst)')
```

**How to catch this:** After running a scraper locally, find a film with multiple screenings on different dates and verify each screening has a distinct, correct date. A count check alone will not catch this bug.

### Turbopack: SVG Imports Return Raw Objects

**Problem:** SVG files imported as React components render as `[object Object]` or throw "Element type is invalid" when running `pnpm dev --turbopack`.

**Cause:** The webpack SVGR rule in `next.config.js` does not apply to Turbopack. Turbopack needs its own separate rule.

**Solution:** Both must be configured in `next.config.js`:

```js
// webpack (existing)
webpack: (config) => {
  config.module.rules.push({ test: /\.svg$/i, use: ['@svgr/webpack'] })
  return config
},
// Turbopack (separate config)
experimental: {
  turbo: {
    rules: { '*.svg': { loaders: ['@svgr/webpack'], as: '*.js' } },
  },
},
```

### Turbopack: `Object.groupBy` Not Available in SSR Sandbox

**Problem:** `TypeError: Object.groupBy is not a function` at runtime even when running Node 22 locally.

**Cause:** Turbopack's SSR sandbox runs in an environment where `Object.groupBy` (Node 21+) is not available.

**Solution:** Use `reduce` or `flatMap` instead of `Object.groupBy` in any code that runs during SSR.

### Monorepo: Don't Rely on Transitive `@types/*` Packages

**Problem:** A `@types/*` package works locally but causes "Could not find a declaration file" in CI.

**Cause:** In the pnpm monorepo, a `@types/*` devDependency from one package (e.g. `cloud`) can be hoisted and picked up by another (e.g. `web`) locally — but CI only installs what's explicitly declared.

**Rule:** Each package must declare its own `@types/*` devDependencies. For example, `web/` uses luxon and must have `@types/luxon` in its own `devDependencies`, even though `cloud/` also has it.

### Circular Imports: Use `import type` for Type-Only Cross-Component Imports

**Problem:** Two component files that import from each other cause a runtime "Element type is invalid: expected a string or a class/function but got: object" error, even though TypeScript compiles fine.

**Cause:** Circular runtime imports resolve to `undefined` at the point of use. TypeScript erases type-only imports at compile time, so the cycle only becomes a problem at runtime.

**Solution:** When a child component only needs a type from a parent (e.g. `Row` from `Calendar/index.tsx`), use `import type` which is erased at runtime and breaks the cycle:

```typescript
// Causes runtime circular dependency
import { Row } from '.'

// Safe — erased at compile time
import type { Row } from '.'
```

### `hasEnglishSubtitles`: Filter on Subtitles, Not Language

**Problem:** Films where the spoken language is English (but subtitles are Dutch or absent) are incorrectly included.

**Rule:** Always filter on the `subtitles` field containing `"engels"`, never on `language` containing `"engels"`. A film spoken in English does not automatically have English subtitles.

```typescript
// Wrong: includes English-language films without subtitles
hasEnglishSubtitles({ language: 'Engels', subtitles: '' }) // → should be false

// Correct: only include when subtitles field says Engels
hasEnglishSubtitles({ language: 'Japans', subtitles: 'Engels' }) // → true
```

## Important Notes for AI Assistants

### Git and Version Control

- **Never commit or push without explicit user approval.** Always show the proposed changes and ask before running `git commit` or `git push`.

### When Adding New Features

1. **Don't over-engineer:** Keep solutions simple and focused
2. **Match existing patterns:** Follow the scraper structure already in place
3. **Test thoroughly:** Always test locally before deploying
4. **Update documentation:** Add comments for complex logic

### When Modifying Scrapers

1. **Check cinema website changes:** Scrapers break when sites change
2. **Preserve existing logic:** Don't remove working filters
3. **Handle errors gracefully:** Use try-catch and log errors
4. **Respect rate limits:** Use p-map for concurrency control

### When Working with AWS

1. **Use dev stage first:** Never test directly in prod
2. **Monitor costs:** Puppeteer Lambda can be expensive
3. **Check CloudWatch logs:** Always verify Lambda execution
4. **Use hot-swap when possible:** Faster deploys during development

### Code Review Checklist

Before committing:

- [ ] Code follows Prettier formatting (run `pnpm format`)
- [ ] TypeScript compiles without errors (`pnpm type-check`)
- [ ] Tests pass (if applicable)
- [ ] Scrapers tested locally with real cinema data
- [ ] Environment variables documented
- [ ] Error handling added for external API calls
- [ ] Logs added for debugging

## Key File Reference

### Configuration Files

- `pnpm-workspace.yaml` - Workspace package definitions
- `.nvmrc` - Node version specification
- `.prettierrc` - Code formatting rules
- `cloud/cdk.json` - CDK configuration
- `cloud/lib/backend-stack.ts` - AWS infrastructure definition
- `web/next.config.js` - Next.js configuration

### Entry Points

- `cloud/handler.ts` - Lambda handler wrapper
- `cloud/scrapers/index.ts` - Main scraper orchestrator
- `cloud/scrapers.ts` - Scraper execution logic
- `web/pages/index.tsx` - Homepage
- `web/pages/city/[city].tsx` - City-specific pages

### Important Utilities

- `cloud/browser.ts` - Puppeteer browser management
- `cloud/documentClient.ts` - DynamoDB client
- `cloud/metadata/` - TMDB/OMDB metadata fetching
- `cloud/powertools.ts` - AWS Lambda Powertools logger setup
- `web/utils/getScreenings.ts` - Fetch screenings from S3

## External Dependencies

### API Keys Required

- **TMDB API** (The Movie Database) - Movie metadata
- **OMDB API** (Open Movie Database) - Additional metadata
- **Google Custom Search API** - Fallback for metadata search
- **ScrapeOps API** - Proxy service for scrapers
- **Slack Webhook** - Notifications

### External Services

- **AWS Services:** Lambda, S3, DynamoDB, CloudWatch, EventBridge
- **GitHub Pages:** Static site hosting
- **GitHub Actions:** CI/CD pipelines

## Repository Conventions

### Branch Strategy

- `main` - Production branch (auto-deploys to prod)
- Feature branches - Use descriptive names

### Commit Messages

Follow existing patterns:

- `deploy web` - Trigger web deployment
- `bump to force web deploy` - Force rebuild
- `Add new cinema scraper: {name}`
- `Fix {cinema} scraper subtitle detection`

### Pull Requests

- Test changes locally first
- Include description of what changed
- Reference related issues if applicable

---

**Last Updated:** 2026-03-21
**Project Version:** See individual package.json files
**Maintainer:** Casper Kuijjer (casper@kuijjer.com)
