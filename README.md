# Expat Cinema

Cloud and SPA deploy should be handled by GitHub Actions

- `cd cloud; yarn deploy` to deploy the lambda functions -- now handled by GitHub Actions
- `cd cloud; yarn start` to manually run the scrapers
- `cd spa; yarn deploy` to deploy the SPA to GitHub Pages

## Scratchpad

To get debugging output from x-ray and x-ray-crawler

```
DEBUG=x-ray,x-ray-crawler node lantarenvenster.js
```

or to get all debugging output

```
DEBUG=*,-resolve node lantarenvenster.js
```

or to run all of the scrapers and add them to the data directory

```
DEBUG=*,-resolve node index.js 2> output/`date -u +"%Y-%m-%dT%H:%M:%SZ"`_all.log
```
