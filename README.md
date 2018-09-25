# Expat Cinema

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
- status code other than 200

## Issues

- x-ray
  - doesn't give back the http status code, so I can't check on a 504 gateway timeout
  - doesn't return the DOM for a selector, only returns the innerText
