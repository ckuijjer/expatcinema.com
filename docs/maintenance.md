# Maintenance

How expatcinema.com is kept healthy. Written for scheduled Claude agents, which do the checking, and for the maintainer, who reviews what they report.

**Division of labour:** agents check, investigate and propose fixes (as PRs). The maintainer reviews the Slack reports and merges PRs. Agents never merge, deploy, or write to AWS.

## This repo is public

Everything in this file, and everything an agent commits, is public. Therefore:

- **Never commit** secrets, tokens, raw AWS logs, AWS account IDs, IAM ARNs, or Slack channel/user IDs.
- **Run reports go to Slack** (`#expatcinema`), not into the repo. Details and log excerpts go in a thread under the report. Slack (free plan) keeps only 90 days of history, so anything worth remembering longer, like a cinema's status or a recurring cause, goes into the status table below.
- **Logs stay in CloudWatch** (2 month retention). Quote only the lines needed, with account IDs redacted.
- This file holds only curated, non-sensitive knowledge: rules, procedures, and the cinema status table below.

## How the pipeline runs

| When (UTC) | What                                                                                                                                   |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 03:00      | EventBridge starts the `expatcinema-prod-scrapers` Lambda (takes about 1 minute)                                                       |
| ~03:01     | Lambda writes `screenings.json`, `movies.json`, `title-matches.json` to the public bucket and per-scraper counts to DynamoDB analytics |
| ~03:01     | Lambda dispatches the `Web` workflow (`cloud/triggerWebDeploy.ts`)                                                                     |
| ~03:03     | `Web` has rebuilt and deployed the static site to GitHub Pages                                                                         |

Scraper `WARN`/`ERROR` log lines are forwarded to Slack by the notify-slack Lambda.

## Data sources

Usable without AWS credentials (cloud agents):

- Public data: `https://s3-eu-west-1.amazonaws.com/expatcinema-public-prod/screenings.json` (also `movies.json`, `title-matches.json`). The `Last-Modified` header is the time of the last successful scrape.
- Per-scraper counts for the last ~28 runs: `https://4jiprxxc8g.execute-api.eu-west-1.amazonaws.com/analytics`. Rows look like `{ "type": "count", "createdAt": "<ISO>", "scraper": "<name>", "value": <n> }`; `scraper` is also `all` and `allWithMovieId`.
- Site deploys: `gh run list --workflow web.yml` / `gh api repos/ckuijjer/expatcinema.com/actions/workflows/web.yml/runs`.
- Slack `#expatcinema`: alerts and earlier reports.

With AWS access (local sessions, read-only profile `casper-readonly`):

- Logs: `aws logs tail /aws/lambda/expatcinema-prod-scrapers --since 12h`
- Private bucket `expatcinema-scrapers-output-prod`: per-scraper raw output, `review/ambiguous-movies/`, `review/unmatched-movies/`.

## Routine 1: Daily health check

**When:** every day, 05:30 UTC (the morning after the nightly run).

**Checks:**

1. **Scrape ran:** `screenings.json` `Last-Modified` is today, after 03:00 UTC.
2. **Site deployed:** a `Web` run started today after the scrape, and its conclusion is `success`.
3. **Volume:** today's `all` count is at least 60% of the median of the previous 14 runs.
4. **Per cinema**, using the analytics history and the status table below (only cinemas with status `ok` raise alerts):
   - **Broken:** 0 screenings for 3+ consecutive runs, while its median over the previous 14 runs is above 0.
   - **Suspicious:** below 50% of the same weekday one week earlier, and a drop of at least 5 screenings.
   - **Recovered:** a cinema with status `broken` or `idle` that now returns screenings. Report it, so its status can be updated.
5. **New errors:** `ERROR` alerts in Slack since yesterday's check, for scrapers other than those already `broken`.

**Weekly rhythm (don't alert on it):** most cinemas publish next week's programme on Monday, so counts are lowest in Monday's run (about 0.8× normal) and jump in Tuesday's run. A single low Monday is not a problem. Zeros are not more likely on any particular weekday.

**Output:** one Slack message in `#expatcinema`.

- All fine: `✅ Daily health <date>: scraped 03:01, site deployed 03:03, <n> screenings across <k> cinemas.`
- Otherwise: `⚠️ Daily health <date>` with one line per finding (cinema, what's wrong, likely cause), and details in a thread.

## Routine 2: Weekly quality audit

**When:** Tuesdays, 12:00 UTC (after most weekly programmes are published).

**Precision: no screening without English subtitles.** Every listed screening must have English subtitles. An English-language film without subtitles does not qualify. Sample 15 random upcoming screenings from `screenings.json`, spread across cinemas. For each, open its `url` and confirm the cinema says it has English subtitles. Report every false positive, with the evidence.

**Recall: are we missing screenings?** Each week take a quarter of the `ok` cinemas (rotate alphabetically by ISO week number, so all are covered every 4 weeks). For each, compare the cinema's own English-subtitles listing (see the source URL in `SCRAPERS_OVERVIEW.md`) with what `screenings.json` has for that cinema. Report screenings we're missing, and screenings we list that the cinema doesn't.

**Output:** one Slack message with the findings. For clear scraper bugs the agent may open a PR with a fix, linked from the thread.

## Routine 3: Quarterly cinema discovery

**When:** 1 January, April, July and October, 09:00 UTC.

Look for cinemas in the Netherlands that show films with English subtitles but aren't scraped yet: search for "English subtitles" / "Engelse ondertiteling" / "expat cinema" programmes, Cineville cinemas, and film festivals. Skip cinemas already listed in `docs/cinema-research.md`. Report candidates in Slack, and open a PR adding the outcome to `docs/cinema-research.md`.

## Working on findings

- Fixing a scraper: follow `AGENTS.md` (run it with `pnpm scraper scrapers/<name>.ts`, add or update a test, open a PR). After merging, the maintainer runs `pnpm run scrapers:prod`.
- When a cinema's status changes, update the table below in the same PR.

## Cinema status

Baseline from the 29 runs between 2026-08-31 and 2026-09-28. Statuses: `ok` (monitored), `broken` (known broken, being fixed), `idle` (scraper works, but the cinema has no English-subtitled screenings right now; check again in the quarterly discovery).

| Scraper                  | Status | Notes (as of 2026-09-28)                        |
| ------------------------ | ------ | ----------------------------------------------- |
| amstelveen               | idle   | subs now in Production.Other; all NL (09-28)    |
| bioscopenleiden          | ok     | fixed 2026-09-28 ("ENGLISH SUBS" tag)           |
| castellum                | idle   | no English-subtitled films (2026-09-28)         |
| chasse                   | broken | BunnyCDN bot wall, blocks Chromium too; ask     |
| cinecenter               | ok     |                                                 |
| cinecitta                | idle   | new domain (#375); no Eng-subs films (09-28)    |
| cinemadevlugt            | idle   | Expat Cinema list empty (2026-09-28)            |
| cinemathepulse           | ok     | fixed 2026-09-28 (URL marker changed)           |
| cinerama                 | broken | works locally (13); fails in prod, AWS IP?      |
| concordia                | ok     |                                                 |
| defilmhallen             | ok     |                                                 |
| desien                   | ok     | fixed 2026-09-28 (new English marker)           |
| deuitkijk                | ok     |                                                 |
| dewittdordrecht          | idle   | no Expat Cinema; all films NL subs (09-28)      |
| dokhuis                  | ok     | occasional: film nights with English subs       |
| eyefilm                  | ok     |                                                 |
| fchyena                  | broken | new Framer site, no /agenda/; needs rewrite     |
| filmhuisbreda            | broken | works locally; 403 in prod, AWS IP blocked?     |
| filmhuisbussum           | idle   | no English-subtitled films (2026-09-28)         |
| filmhuisdenhaag          | ok     |                                                 |
| filmhuislumen            | ok     |                                                 |
| filmkoepel               | idle   | Expat page redesigned; selectors need update    |
| filmtheaterhilversum     | ok     | fixed 2026-09-28 (time parsing)                 |
| florafilmtheater         | ok     |                                                 |
| focusarnhem              | ok     | fixed 2026-09-30 (new site, GraphQL API)        |
| forumgroningen           | ok     |                                                 |
| hartlooper               | ok     |                                                 |
| heerenstraattheater      | broken | works locally; 403 in prod, AWS IP blocked?     |
| hetdocumentairepaviljoen | ok     | fixed 2026-09-28 (subtitle label changed)       |
| ketelhuis                | ok     | small (1–6); empty pages retried, then WARN     |
| kinorotterdam            | ok     |                                                 |
| kriterion                | ok     |                                                 |
| lab1                     | ok     |                                                 |
| lab111                   | ok     |                                                 |
| lantarenvenster          | ok     | festival spikes, e.g. 24–27 Sep 2026; not a bug |
| lumiere                  | ok     | fixed 2026-09-28 (GraphQL API)                  |
| lux                      | ok     | fixed 2026-09-28 (3 English markers)            |
| melkweg                  | ok     |                                                 |
| natlab                   | ok     |                                                 |
| rialto                   | ok     | fixed 2026-09-28 via JSON API; De Pijp only now |
| rialtovu                 | ok     | added 2026-09-30 (VU Griffioen)                 |
| schuur                   | ok     |                                                 |
| slachtstraat             | ok     |                                                 |
| sliekerfilm              | ok     | 0 until 2026-09-15                              |
| springhaver              | ok     |                                                 |
| studiok                  | ok     |                                                 |
| themovies                | ok     | low but correct: 1 English-subtitled film       |
| worm                     | ok     |                                                 |
