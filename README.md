# Expat Cinema

[Expat Cinema](https://expatcinema.com) shows foreign movies with english subtitles that are screened in cinemas in the Netherlands. It can be found at https://expatcinema.com.

## Deploy Cloud

### Deploy

A GitHub Action is used to deploy the Serverless application to AWS. The action is triggered by a push to the `main` branch.

### Scrapers

#### Scheduled

The scrapers run on a daily schedule defined in `cloud/serverless.yml`

#### Manual

- `cd cloud; yarn scrapers` to run the scrapers on the _dev_ stage
- `cd cloud; yarn scrapers:prod` to run the scrapers on the _prod_ stage

## Deploy Web

### Scheduled

The web is deployed on a daily schedule using GitHub Actions. The schedule is defined in `.github/workflows/web.yml`. The schedule is needed to have the SSG (static site generator) get the latest data from the scrapers.

### Manual

Easiest is to bump the version in `web/package.json` and push to master. This will trigger a GitHub Action that will deploy the web app to GitHub Pages. Note there's only a _prod_ stage for the web app.

## Running scrapers locally

```
yarn scrapers:local
```

Stores the output in _cloud/.esbuild/.build/output_ instead of S3 buckets and DynamoDB

Use SCRAPERS environment variable in _.env.local_ to define a comma separated list of scrapers to locally run and diverge from the default set of scrapers in _scrapers/index.js_

And to call a single scraper, e.g. `LOG_LEVEL=debug yarn tsx scrapers/kinorotterdam.ts` and then have e.g.

```
if (require.main === module) {
  extractFromMoviePage(
    'https://kinorotterdam.nl/films/cameron-on-film-aliens-1986/',
  ).then(console.log)
}
```

with the LOG_LEVEL=debug used to have debug output from the scrapers show up in the console

## CI/CD

GitHub actions is used, `web/` uses JamesIves/github-pages-deploy-action to deploy to the _gh-pages_ branch, and the GitHub settings has Pages take the source branch _gh-pages_ which triggers the GitHub built in _pages-build-deployment_

`.env.*` files are only used for the local stage, not for running other stages locally, and not for CI/CD, for that take a look at the GitHub secrets and variables (on repository and environment level)

## Quick local backup

```
aws s3 sync s3://expatcinema-scrapers-output expatcinema-scrapers-output --profile casper
aws s3 sync s3://expatcinema-public expatcinema-public--profile casper
aws dynamodb scan --table-name expatcinema-scrapers-analytics --profile casper > expatcinema-scrapers-analytics.json
```

### Favicon

- Use https://favicongrabber.com/ to grab a favicon for the cinema.json file
- Use https://www.google.com/s2/favicons?domain=www.natlab.nl to get the favicon for the cinema.json file

## Chromium

Some scrapers need to run in a real browser, for which we use puppeteer and a lambda layer with Chromium.

### Upgrading puppeteer and chromium

- Find the preferred version of Chromium for the latest version of puppeteer at https://pptr.dev/supported-browsers, e.g. _Chrome for Testing 123.0.6312.105 - Puppeteer v22.6.3_
- Check if this version of Chromium is available (for running locally) at https://github.com/Sparticuz/chromium, check the package.json
- Check if this version of Chromium is available (as a lambda layer) at https://github.com/shelfio/chrome-aws-lambda-layer, e.g. _Has Chromium v123.0.1_ and _arn:aws:lambda:us-east-1:764866452798:layer:chrome-aws-lambda:45_

```sh
yarn add puppeteer-core@22.6.3 @sparticuz/chromium@^123.0.1
```

After installing the new version of puppeteer and chromium update the lambda layer in serverless.yml, by doing a search and replace on `arn:aws:lambda:eu-west-1:764866452798:layer:chrome-aws-lambda:` and change e.g. `44` to `45`

### Installing Chromium for use by puppeteer-core locally

See https://github.com/Sparticuz/chromium#running-locally--headlessheadful-mode for how

## Troubleshooting

When running a puppeteer based scraper locally, e.g. `yarn tsx scrapers/ketelhuis.ts` and getting an error like

```
Error: Failed to launch the browser process! spawn /tmp/localChromium/chromium/mac_arm-1205129/chrome-mac/Chromium.app/Contents/MacOS/Chromium ENOENT
```

you need to install Chromium locally, run `yarn install-chromium` to do so and update `LOCAL_CHROMIUM_EXECUTABLE_PATH` in `browser.ts` to point to the Chromium executable. See https://github.com/Sparticuz/chromium#running-locally--headlessheadful-mode for how
