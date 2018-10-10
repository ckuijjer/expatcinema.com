# Expat Cinema

## Procedure for new adding new movies

1. `yarn start` to run all scrapers
1. `yarn analyze` to run some analysis on the scraper log output
1. `yarn compare_filtered` to compare the latest scrape with the latest scrape with filtering rules applied
1. `yarn compare_screenings` to compare the current screenings with the latest scrape (note that the order of the comparison is confusing, screenings.json is on the right so it's editable in VS Code)
1. Manually remove removed movies from screenings.json
1. `yarn add_screenings` to add the newest scrape output to spa/data/screenings.json
1. Compare changes manually, also looking at movies that might've changed just e.g. 15 minutes, commit and deploy

## Snippets

To sort the output of a e.g. scraper, or screenings.json

```
cat ../spa/src/data/screenings.json | ./sort.js | c
```

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

and to do some simple analysis on the output file

- socket hangup - `ls -t output/*_all.log | head -1|xargs grep -i 'socket hang up'`
- promise rejection - `ls -t output/*_all.log | head -1|xargs grep -i UnhandledPromiseRejectionWarning`
- status code other than 200 - `ls -t output/*_all.log | head -1|xargs grep -i 'with status code'|grep -v 'with status code: 200'`
- date: null - `ls -t output/*_all.json | head -1|xargs grep -i '"date": null'`

## Issues

- x-ray
  - doesn't give back the http status code, so I can't check on a 504 gateway timeout
  - doesn't return the DOM for a selector, only returns the innerText
