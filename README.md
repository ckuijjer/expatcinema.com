# Expat Cinema

Cloud and Web deploy is handled by GitHub Actions

- `cd cloud; yarn deploy` to deploy the lambda functions -- now handled by GitHub Actions
- `cd cloud; yarn start` to manually run the scrapers
- `cd web; yarn deploy` to deploy the SPA to GitHub Pages

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

## CI/CD

GitHub actions is used, `web/` uses JamesIves/github-pages-deploy-action to deploy to the _gh-pages_ branch, and the GitHub settings has Pages take the source branch _gh-pages_ which triggers the GitHub built in _pages-build-deployment_
