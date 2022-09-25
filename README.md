# Expat Cinema

## Deploy Cloud

### Scheduled

The scrapers run on a daily schedule defined in `cloud/serverless.yml`

### Manual

- `cd cloud; yarn scrapers` to run the scrapers on the _dev_ stage
- `cd cloud; yarn scrapers:prod` to run the scrapers on the _prod_ stage

## Deploy Web

### Scheduled

The web is deployed on a daily schedule using GitHub Actions. The schedule is defined in `.github/workflows/web.yml`. The schedule is needed to have the SSG (static site generator) get the latest data from the scrapers.

### Manual

Easiest is to bump the version in `web/package.json` and push to master. This will trigger a GitHub Action that will deploy the web app to GitHub Pages.

## Running scrapers locally

```
yarn scrapers:local
```

Stores the output in _cloud/.esbuild/.build/output_ instead of S3 buckets and DynamoDB

Use SCRAPERS environment variable in _.env.local_ to define a comma separated list of scrapers to locally run and diverge from the default set of scrapers in _scrapers/index.js_

And to call a single scraper, e.g. `yarn ts-eager scrapers/kinorotterdam.ts` and then have e.g.

```
if (require.main === module) {
  extractFromMoviePage(
    'https://kinorotterdam.nl/films/cameron-on-film-aliens-1986/',
  ).then(console.log)
}
```

## CI/CD

GitHub actions is used, `web/` uses JamesIves/github-pages-deploy-action to deploy to the _gh-pages_ branch, and the GitHub settings has Pages take the source branch _gh-pages_ which triggers the GitHub built in _pages-build-deployment_

`.env.*` files are only used locally, not in CI/CD, for that take a look at the GitHub secrets

## Quick local backup

```
aws s3 sync s3://expatcinema-scrapers-output expatcinema-scrapers-output --profile casper
aws s3 sync s3://expatcinema-public expatcinema-public--profile casper
aws dynamodb scan --table-name expatcinema-scrapers-analytics --profile casper > expatcinema-scrapers-analytics.json
```
