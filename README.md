# Expat Cinema

[Expat Cinema](https://expatcinema.com) shows foreign movies with english subtitles that are screened in cinemas in the Netherlands. It can be found at https://expatcinema.com.

## Deploy Cloud

### Deploy Prod

A GitHub Action is used to deploy to AWS. The action is triggered by a push to the `main` branch.

The `.env` file from `cloud/` is only used when running it locally, when deploying using CI/CD the environment variables are set in the GitHub _Secrets and Variables > Actions > Repository Secrets_. The `.env` file is not checked into git, so it won't be available in the CI/CD environment.

### Deploy Dev

It's possible to create a _dev_ stage, by locally running e.g.

```sh
pnpm run synth  # synthesize the cdk stack for dev
pnpm run watch  # watch for changes, deploy to dev
pnpm run deploy # deploy to dev
```

### Scrapers

#### Scheduled Prod

The scrapers run on a daily schedule defined in the cdk stack in `cloud/lib/backend-stack.ts`.

#### Manual Prod

- `cd cloud; pnpm run scrapers:prod` to run the scrapers on the _prod_ stage, see _output/expatcinema-prod-scrapers.json_ for the output of the scrapers.

#### Manual Dev

- `cd cloud; pnpm run scrapers` to run the scrapers on the _dev_ stage, see _output/expatcinema-dev-scrapers.json_ for the output of the scrapers.

If you want to run it on only a few scrapers, you can use the `SCRAPERS` environment variable in _.env_ to specify which scrapers to run. After making changes, `pnpm run deploy` and `pnpm run scrapers`.

Or as `cdk watch` doesn't trigger on _.env_ file changes, when running `pnpm run watch` trigger a deploy by making a change in a _.ts_ file, and afterwards run `pnpm run scrapers`

`pnpm run config:scraper` can be used to get the lambda function configuration for the scrapers.

## Deploy Web

### Scheduled Prod

The web is deployed on a daily schedule using GitHub Actions. The schedule is defined in `.github/workflows/web.yml`. The schedule is needed to have the SSG (static site generator) get the latest data from the scrapers.

GitHub actions is used, `web/` uses JamesIves/github-pages-deploy-action to deploy to the _gh-pages_ branch, and the GitHub settings has Pages take the source branch _gh-pages_ which triggers the GitHub built in _pages-build-deployment_

### Manual

Easiest is to bump the version in `web/package.json` and push to master. This will trigger a GitHub Action that will deploy the web app to GitHub Pages. Note there's only a _prod_ stage for the web app.

## Running scrapers locally

**Note: Currently broken**

```
pnpm run scrapers:local
```

Stores the output in _cloud/output_ instead of S3 buckets and DynamoDB

Use SCRAPERS environment variable in _.env.local_ to define a comma separated list of scrapers to locally run and diverge from the default set of scrapers in _scrapers/index.js_

And to call a single scraper, e.g. `LOG_LEVEL=debug pnpm tsx scrapers/kinorotterdam.ts` and then have e.g.

```
if (require.main === module) {
  extractFromMoviePage(
    'https://kinorotterdam.nl/films/cameron-on-film-aliens-1986/',
  ).then(console.log)
}
```

with the LOG_LEVEL=debug used to have debug output from the scrapers show up in the console

## Quick local backup

### Backup

Creates a backup of the S3 buckets and DynamoDB tables

```sh
cd backup/
export STAGE=prod
aws s3 sync s3://expatcinema-scrapers-output-$STAGE expatcinema-scrapers-output-$STAGE --profile casper
aws s3 sync s3://expatcinema-public-$STAGE expatcinema-public-$STAGE --profile casper
aws dynamodb scan --table-name expatcinema-scrapers-analytics-$STAGE --profile casper > expatcinema-scrapers-analytics-$STAGE.json
aws dynamodb scan --table-name expatcinema-scrapers-movie-metadata-$STAGE --profile casper > expatcinema-scrapers-movie-metadata-$STAGE.json
```

For the DynamoDB tables, it might be better to use the _Export to S3_ functionality in the AWS Console, as these can be imported using `aws dynamodb import-table`

### Restore

The S3 buckets can be restored by running the following commands

```sh
cd backup/
export STAGE=prod
aws s3 sync expatcinema-scrapers-output-$STAGE s3://expatcinema-scrapers-output-$STAGE --profile casper
aws s3 sync expatcinema-public-$STAGE s3://expatcinema-public-$STAGE --profile casper
```

The DynamoDB tables can be restored by running the following commands. Note that this doesn't batch, it just puts the items back one by one, which might be slow for large tables.

```sh
cd backup/
export STAGE=prod

jq -c '.Items[]' expatcinema-scrapers-analytics-$STAGE.json | while read -r item; do
  aws dynamodb put-item \
    --table-name expatcinema-scrapers-analytics-$STAGE \
    --item "$item" \
    --profile casper
done

jq -c '.Items[]' expatcinema-scrapers-movie-metadata-$STAGE.json | while read -r item; do
  aws dynamodb put-item \
    --table-name expatcinema-scrapers-movie-metadata-$STAGE \
    --item "$item" \
    --profile casper
done
```

### Favicon

- Use https://favicongrabber.com/ to grab a favicon for the cinema.json file
- Use https://www.google.com/s2/favicons?domain=www.idfa.nl to get the favicon for the cinema.json file

## Chromium

Some scrapers need to run in a real browser, for which we use puppeteer and a lambda layer with Chromium.

### Upgrading puppeteer and chromium

- Find the preferred version of Chromium for the latest version of puppeteer at https://pptr.dev/supported-browsers, e.g. _Chrome for Testing 123.0.6312.105 - Puppeteer v22.6.3_
- Check if this version of Chromium is available (for running locally) at https://github.com/Sparticuz/chromium, check the package.json
- Check if this version of Chromium is available (as a lambda layer) at https://github.com/shelfio/chrome-aws-lambda-layer, e.g. _Has Chromium v123.0.1_ and _arn:aws:lambda:us-east-1:764866452798:layer:chrome-aws-lambda:45_

```sh
pnpm add puppeteer-core@22.6.3 @sparticuz/chromium@^123.0.1
pnpm add -D puppeteer@22.6.3
```

After installing the new version of puppeteer and chromium update the lambda layer in the cdk stack, by doing a search and replace on `arn:aws:lambda:eu-west-1:764866452798:layer:chrome-aws-lambda:` and change e.g. `44` to `45`

### Installing Chromium for use by puppeteer-core locally

See https://github.com/Sparticuz/chromium#running-locally--headlessheadful-mode for how

## Troubleshooting

When running a puppeteer based scraper locally, e.g. `pnpm tsx scrapers/ketelhuis.ts` and getting an error like

```
Error: Failed to launch the browser process! spawn /tmp/localChromium/chromium/mac_arm-1205129/chrome-mac/Chromium.app/Contents/MacOS/Chromium ENOENT
```

you need to install Chromium locally, run `pnpm install-chromium` which installs Chromium locally and then updates the `LOCAL_CHROMIUM_EXECUTABLE_PATH` in `browser-local-constants.ts` to point to the Chromium executable. See https://github.com/Sparticuz/chromium#running-locally--headlessheadful-mode for more information about how to install a locally running chromium.
