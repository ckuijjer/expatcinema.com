# Expat Cinema Copilot Instructions

## Project Overview

Expat Cinema is a movie screening aggregator for foreign films with English subtitles in Dutch cinemas. The architecture consists of:

- **cloud/**: AWS CDK infrastructure with Lambda scrapers, S3 buckets, and DynamoDB tables
- **web/**: Next.js static site generator deployed to GitHub Pages
- **scripts/**: Data analysis utilities for screening data
- **data/**: Local data storage for analysis

## Architecture & Data Flow

### Scraper System (cloud/)

- **Individual scrapers** (`cloud/scrapers/*.ts`): Each cinema has a dedicated scraper that extracts screening data
- **Main handler** (`cloud/scrapers/index.ts`): Orchestrates all scrapers, handles metadata enrichment via TMDB/OMDB APIs
- **Data storage**: Raw output goes to S3 (`expatcinema-scrapers-output-{stage}`), processed data to public S3 (`expatcinema-public-{stage}`)
- **Metadata enrichment**: Movie titles are normalized and enriched with TMDB metadata stored in DynamoDB

### Web Application (web/)

- **Static site**: Next.js with `output: 'export'` for GitHub Pages deployment
- **Data source**: Fetches `screenings.json` from public S3 bucket at build time via `getStaticProps`
- **Daily rebuilds**: Scheduled GitHub Action rebuilds site daily to get latest screening data

### Key Data Types

```typescript
type Screening = {
  title: string
  url: string
  cinema: string
  date: Date
}
```

## Development Workflows

### Running Scrapers

```bash
# Local development (cloud/)
pnpm run scrapers          # dev stage
pnpm run scrapers:prod     # prod stage
LOG_LEVEL=debug pnpm tsx scrapers/kinorotterdam.ts  # single scraper

# Control which scrapers run via SCRAPERS env var
SCRAPERS=kinorotterdam,eyefilm pnpm run scrapers
```

### Local Development Setup

```bash
# Install Chromium for Puppeteer-based scrapers
cd cloud && pnpm run install-chromium

# Web development
cd web && pnpm dev --turbopack

# Deploy infrastructure changes
cd cloud && pnpm run deploy  # dev stage
cd cloud && pnpm run watch   # continuous deployment
```

### Environment Configuration

- **Local**: Use `.env` files in respective directories (not committed)
- **CI/CD**: Environment variables stored in GitHub Secrets
- **Stages**: `dev` (local/manual) and `prod` (automated via GitHub Actions)

## Project-Specific Patterns

### Scraper Development

- Each scraper must export a default function returning `Promise<Screening[]>`
- Use `logger.createChild({ persistentLogAttributes: { scraper: 'name' } })` for logging
- Handle both Puppeteer-based and HTTP-based scrapers in `SCRAPERS` object
- Use utility functions in `scrapers/utils/` for common tasks (title cleaning, date parsing)

### Monorepo Structure

- **pnpm workspace** with packages in `cloud/`, `web/`, `scripts/`
- Shared dependencies managed at root level
- Each package has independent `package.json` and build process

### AWS CDK Patterns

- **Lambda layers**: Chrome AWS Lambda layer for Puppeteer scrapers
- **Bundling**: External modules for AWS SDK, include `@sparticuz/chromium`
- **Environment variables**: Passed via CDK stack configuration
- **Scheduled execution**: EventBridge rules trigger daily scraper runs

### Data Processing Pipeline

1. **Raw scraping**: Individual cinema scrapers extract screening data
2. **Aggregation**: All scrapers combined in `scrapers/index.ts`
3. **Metadata enrichment**: TMDB/OMDB APIs add movie details
4. **Storage**: S3 (raw + processed) and DynamoDB (metadata cache)
5. **Web consumption**: Next.js fetches processed data at build time

## Testing & Debugging

### Scraper Testing

```bash
# Test single scraper with debug output
LOG_LEVEL=debug pnpm tsx scrapers/kinorotterdam.ts

# View CloudWatch logs
pnpm run log  # tails and prettifies logs
```

### Local vs Production Differences

- **Local execution**: Uses `IS_LOCAL=true`, writes to `output/` directory
- **Lambda execution**: Writes to S3 and DynamoDB
- **Chromium**: Local uses installed binary, Lambda uses layer

## Common Tasks

### Adding New Cinema Scraper

1. Create `cloud/scrapers/newcinema.ts` with scraper logic
2. Add import and entry to `SCRAPERS` object in `scrapers/index.ts`
3. Test locally: `LOG_LEVEL=debug pnpm tsx scrapers/newcinema.ts`
4. Deploy: `pnpm run deploy` from `cloud/`

### Updating Web Content

1. Changes to `web/` trigger GitHub Action automatically
2. Manual trigger via GitHub Actions UI or version bump in `web/package.json`
3. Site rebuilds daily at 3:30 UTC to get latest screening data

### Data Analysis

Use `scripts/` package for ad-hoc analysis:

```bash
cd scripts
pnpm downloadScreenings  # fetch latest data
pnpm analyzeScreenings   # run analysis scripts
```
