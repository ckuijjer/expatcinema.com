# Expat Cinema

Cloud and Web deploy is handled by GitHub Actions

- `cd cloud; yarn deploy` to deploy the lambda functions -- now handled by GitHub Actions
- `cd cloud; yarn start` to manually run the scrapers
- `cd web; yarn deploy` to deploy the SPA to GitHub Pages

## Running scrapers locally

```
yarn scrapers:local
```

Stores the output in _cloud/output_ instead of S3 buckets and DynamoDB

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

## Quick local backup

```
aws s3 sync s3://expatcinema-scrapers-output expatcinema-scrapers-output --profile casper
aws s3 sync s3://expatcinema-public expatcinema-public--profile casper
aws dynamodb scan --table-name expatcinema-scrapers-analytics --profile casper > expatcinema-scrapers-analytics.json
```
