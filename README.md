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
DEBUG=* node lantarenvenster.js
```

## Issues

- x-ray
  - doesn't give back the http status code, so I can't check on a 504 gateway timeout
  - doesn't return the DOM for a selector, only returns the innerText
