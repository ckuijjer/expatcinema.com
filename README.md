# Expat Cinema ![](https://codebuild.eu-west-1.amazonaws.com/badges?uuid=eyJlbmNyeXB0ZWREYXRhIjoiTkpXSFdGRnd1TUtya1Rqb0ZvK3ZFNWtlc3cwbnRnMmhtZm1PQU1iazRMNG51VnNhaUZReVRmL0w5U1NRQTdSb0xhTHhsd1lHZmk1anl3UHBURDBPUnRRPSIsIml2UGFyYW1ldGVyU3BlYyI6IlRhcTdnODZvMWNmOU1HQmEiLCJtYXRlcmlhbFNldFNlcmlhbCI6MX0%3D&branch=master)

- `cd cloud; serverless deploy` to deploy the lambda functions
- `cd cloud; serverless invoke -f scrapers` to manually run the scrapers

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
