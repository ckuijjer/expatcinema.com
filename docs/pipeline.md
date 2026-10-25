# Pipeline

How a screening gets from a cinema's website to expatcinema.com. The code is in `cloud/` (`cloud/scrapers/index.ts` only calls the phases, in order); the text for each phase is in [`AGENTS.md`](../AGENTS.md#cloud-pipeline-phases).

## Overview

```mermaid
flowchart TD
  trigger(["EventBridge, daily 03:00<br/>or <code>gh workflow run scrapers.yml</code>"]) --> lambda

  subgraph lambda["Scrapers Lambda"]
    direction TB
    scrape["<b>1. Scrape</b><br/>pipeline/scrape.ts<br/>51 scrapers from scrapers/registry.ts<br/>title, year, director, event, notes"]
    normalise["<b>2. Normalise</b><br/>pipeline/normalise.ts<br/>drop invalid dates (warn), event from the<br/>EVENTS list, unique and sorted"]
    match["<b>3. Match</b><br/>metadata/resolveMetadata.ts<br/>one TMDB lookup per title and year"]
    resolve["<b>4. Resolve</b><br/>pipeline/resolve.ts<br/>movieId, events and notes found in titles,<br/>movies.json, title-matches.json, review lists"]
    publish["<b>5. Publish</b><br/>pipeline/publish.ts"]
    scrape --> normalise --> match --> resolve --> publish
  end

  cinemas[("Cinema websites<br/>and APIs")] -.-> scrape
  tmdb[("TMDB")] <-.-> match

  publish --> pub[("Public S3<br/>screenings.json<br/>movies.json<br/>title-matches.json")]
  publish --> priv[("Private S3<br/>per scraper, all/,<br/>review/ lists")]
  publish --> ddb[("DynamoDB<br/>counts")]
  publish --> deploy["Dispatches the Web workflow<br/>(triggerWebDeploy.ts)"]

  deploy --> web["Web workflow<br/>Next.js static export"]
  pub -.-> web
  web --> pages(["GitHub Pages<br/>expatcinema.com"])

  lambda -. "WARN and ERROR logs" .-> slack["notify-slack Lambda"] --> channel(["Slack #expatcinema"])
  channel -.-> check(["Daily health check<br/>docs/maintenance.md"])
  priv -.-> check
```

## Match phase

Every unique title and year gets one lookup. A title that doesn't match is retried, in this order, and stops at the first retry that matches.

```mermaid
flowchart TD
  lookup["Title and year<br/>of a screening"] --> manual{"Manual override?<br/>manualTitleOverrides.ts"}
  manual -- yes --> matched
  manual -- no --> search["TMDB search<br/>score 0.85 title + 0.15 year<br/>director as a hint"]
  search --> confident{"Score at least 0.9,<br/>clear gap or popularity tie-break?"}
  confident -- yes --> matched(["Matched"])
  confident -- "several close" --> ambiguous(["Ambiguous<br/>review/ambiguous-movies"])
  confident -- no --> shared

  shared["Retry 1: without a label that 2+ titles<br/>of the same cinema share<br/>sharedLabels.ts"] --> sharedOk{Matched?}
  sharedOk -- yes --> matched
  sharedOk -- no --> parts["Retry 2: one part of the title<br/>split on : - – — • > |<br/>must be the film's own title, same year<br/>titleParts.ts"]
  parts --> partsOk{Matched?}
  partsOk -- yes --> matched
  partsOk -- no --> siblings["Retry 3: with the years that the<br/>same title matched at other screenings<br/>siblingYears.ts"]
  siblings --> siblingsOk{Matched?}
  siblingsOk -- yes --> matched
  siblingsOk -- no --> unmatched(["Unmatched<br/>review/unmatched-movies"])
```

## Events and notes

A scraper sets `event` and `notes` itself where it can. What it leaves open is filled in later, and a screening keeps what a scraper set.

```mermaid
flowchart TD
  scraper["Scraper<br/>event and notes it knows:<br/>+ Q&A, anniversaries, parentheses, ..."] --> list
  list["Normalise: EVENTS list<br/>extractEvent.ts, fixed names"] --> matchPhase
  matchPhase["Match: how did the title match?"]

  matchPhase -- "shared-label<br/>Docs: Naza, Docs: Coward" --> label
  matchPhase -- "title-part<br/>Cinema Aperitivo: Cold War" --> corroborated
  matchPhase -- "tmdb-search" --> plain(["Nothing to find"])

  corroborated{"Same movie shown elsewhere<br/>under just 'Cold War', and the rest<br/>is no name of the film?"}
  corroborated -- yes --> label
  corroborated -- no --> candidate(["Only a candidate in<br/>review/detected-events"])

  label{"What is the label?"}
  label -- "ignored: Expat Cinema, English subs" --> dropped(["Dropped"])
  label -- "says something about the screening:<br/>Q&A, 4K, Director's Cut, with ..." --> note(["Note"])
  label -- "between parentheses" --> note
  label -- "before or after the title" --> event(["Event<br/>review/detected-events: applied"])
```
