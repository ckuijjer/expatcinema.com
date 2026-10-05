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

Scraper `WARN`/`ERROR` log lines are forwarded to Slack by the notify-slack Lambda. A post that Slack rejects is logged (`failed to post to Slack`) and skipped; it used to fail the whole invocation, and Lambda's retry then posted the batch again, up to three times (seen 2026-10-05: a thread over Slack's 3000 character limit, now truncated to 2900).

Failure modes seen so far, and how to recognise them:

- **First invocation timed out, Lambda retried.** The scrapers Lambda has a 9 minute timeout and EventBridge retries a failed async invocation about a minute later, so a hung scraper shows up as analytics rows stamped 03:10 instead of 03:00, and `Status: timeout` in the Lambda's `REPORT` line. Find the culprit as the scraper with a `start scraping` log line but no `done scraping`. Each scraper now has a 4 minute deadline (`withTimeout` in `scrapers/index.ts`) and the shared got driver has a 30 second request timeout, so one stuck cinema can no longer cost the whole run (seen 2026-10-01 to 10-03 with Filmtheater Hilversum, whose pages answer 503 to AWS addresses).
- **A whole cinema suddenly at 0 with a `:sos:` and `Invalid unit value NaN`, or a `toLowerCase` of undefined,** is a date or time label the scraper doesn't recognise (Flora: `Morgen 19:25 Uitverkocht`, `za 24 okt. 15:00 21:15`). Look at what the page shows in the first failing screening. A screening whose date can't be parsed is meant to be skipped with a warning, not to empty the cinema.
- **A cinema that returns 0 with no error** can be the cinema's own page failing: Ketelhuis' Expat Cinema page was blank (HTTP 200, zero bytes) on 2026-10-03, also in a browser.
- **Only `prod` has a schedule.** A dev stage can be deployed, but nothing runs it nightly; an earlier dev stack that did, with the prod Slack channel, produced alerts that looked like prod failures.

Three cinemas block AWS (Filmhuis Breda and Heerenstraattheater via Cloudflare, Cinerama via Kinepolis' firewall). Their pages are fetched through a small relay on the maintainer's home server (teatree), see `cloud/clients/scrapeRelay.ts`. If they suddenly all fail at once with `Error retrieving ... via relay` or a 401/403/5xx from the relay, the relay or its tunnel is down, not the scrapers: check `https://scrape-relay.home.kuijjer.com/health` and tell the maintainer.

## Data sources

Usable without AWS credentials (cloud agents):

- Public data: `https://s3-eu-west-1.amazonaws.com/expatcinema-public-prod/screenings.json` (also `movies.json`, `title-matches.json`). The `Last-Modified` header is the time of the last successful scrape.
- Per-scraper counts for the last ~28 runs: `https://4jiprxxc8g.execute-api.eu-west-1.amazonaws.com/analytics`. Rows look like `{ "type": "count", "createdAt": "<ISO>", "scraper": "<name>", "value": <n> }`; `scraper` is also `all` and `allWithMovieId`.
- Site deploys: `gh run list --workflow web.yml` / `gh api repos/ckuijjer/expatcinema.com/actions/workflows/web.yml/runs`.
- Slack `#expatcinema`: alerts and earlier reports. The channel is noisy (many `:warning:` lines and Node `DeprecationWarning` stack traces per run), so paging `slack_read_channel` by message count, or bounding it with a hand-computed `oldest` timestamp, can land you on a stale page or miss recent messages entirely. To check for new `:sos:` alerts or find a previous report, search instead, e.g. `slack_search_public` with `keywords: [":sos:"]` and `filters: "in:#expatcinema after:<date>"` (or `on:<date>`).

With AWS access (local sessions, read-only profile `casper-readonly`):

- Logs: `aws logs tail /aws/lambda/expatcinema-prod-scrapers --since 12h`
- Private bucket `expatcinema-scrapers-output-prod`: per-scraper raw output, `review/ambiguous-movies/`, `review/unmatched-movies/`.

## Routine 1: Daily health check

**When:** every day, 04:30 UTC (the morning after the nightly run, which finishes before 03:05 UTC).

**Schedule of the three routines:** they run one after the other in the early morning, so the maintainer has the reports when they get up (07:00 Amsterdam time is 05:00 UTC in summer, 06:00 UTC in winter): daily 04:30 UTC, weekly audit Tuesdays 04:45 UTC, quarterly discovery on the 1st of Jan/Apr/Jul/Oct at 05:15 UTC. The scheduler starts a routine a few minutes after its time (6 to 14 minutes seen) and a run takes about 5 (daily), 11 (weekly) or 2 to 10 minutes (quarterly), so they can occasionally overlap, which does no harm.

**Checks:**

1. **Scrape ran:** `screenings.json` `Last-Modified` is today, after 03:00 UTC.
2. **Site deployed:** a `Web` run started today after the scrape, and its conclusion is `success`.
3. **Volume:** today's `all` count is at least 60% of the median of the previous 14 runs.
4. **Per cinema**, using the analytics history and the status table below (only cinemas with status `ok` raise alerts):
   - **Broken:** 0 screenings for 3+ consecutive runs, while its median over the previous 14 runs is above 0.
   - **Suspicious:** below 50% of the same weekday one week earlier, and a drop of at least 5 screenings.
   - **Recovered:** a cinema with status `broken` or `idle` that now returns screenings. Report it, so its status can be updated.
5. **New errors:** `ERROR` alerts in Slack since yesterday's check, for scrapers other than those already `broken`.
6. **Waiting PRs:** open PRs with the label `waiting-for-screenings` (`https://api.github.com/repos/ckuijjer/expatcinema.com/issues?labels=waiting-for-screenings&state=open`). These are scrapers for cinemas that don't have English-subtitled screenings yet (status `idle`), kept open instead of merged. For each, run the PR's scraper and see whether it now returns screenings:
   - Find the scraper from the PR's files (`cloud/scrapers/<name>.ts`), fetch the PR head (`git fetch origin pull/<n>/head`) into a scratch worktree outside the repo checkout (`git worktree add /tmp/pr-<n> FETCH_HEAD`), run `corepack enable; pnpm install --frozen-lockfile` there, then `cd cloud && pnpm scraper:headless scrapers/<name>.ts`.
   - **Ready to merge:** it returns 1 or more screenings. Open at least 2 of the returned `url`s and look for the English-subtitles evidence the scraper relies on; say whether each is confirmed. Report the PR, the number of screenings and up to 5 examples (title, date and time in Amsterdam time, url). The maintainer decides and merges.
   - **Failing:** the scraper throws or the site no longer looks like the PR expects. Report it, the PR needs rework.
   - Still 0 screenings: not a finding. Mention in the thread how many PRs are waiting.

**Weekly rhythm (don't alert on it):** most cinemas publish next week's programme on Monday, so counts are lowest in Monday's run (about 0.8× normal) and jump in Tuesday's run. A single low Monday is not a problem. Zeros are not more likely on any particular weekday.

**Output:** one Slack message in `#expatcinema`.

- All fine: `✅ Daily health <date>: scraped 03:01, site deployed 03:03, <n> screenings across <k> cinemas.`
- Otherwise: `⚠️ Daily health <date>` with one line per finding (cinema, what's wrong, likely cause), and details in a thread.
- A waiting PR that is ready to merge is good news, not a problem: add the line `🟢 Ready to merge: #<n> <cinema> now has <k> English-subtitled screenings` to the message (also when everything else is fine, so use the `✅` headline then), and put the examples in the thread. Mention that after merging, the cinema's status in the table below changes from `idle` to `ok`.

## Routine 2: Weekly quality audit

**When:** Tuesdays, 04:45 UTC, after the daily check. Most cinemas publish the next week's programme on Monday, so by Tuesday's nightly run it is in the data.

**Precision: no screening without English subtitles.** Every listed screening must have English subtitles. An English-language film without subtitles does not qualify. Sample 15 random upcoming screenings from `screenings.json`, spread across cinemas. For each, open its `url` and confirm the cinema says it has English subtitles. Report every false positive, with the evidence.

**Recall: are we missing screenings?** Each week take a quarter of the `ok` cinemas (rotate alphabetically by ISO week number, so all are covered every 4 weeks). For each, compare the cinema's own English-subtitles listing (see the source URL in `SCRAPERS_OVERVIEW.md`) with what `screenings.json` has for that cinema. Report screenings we're missing, and screenings we list that the cinema doesn't.

**Matching: why are screenings unmatched?** `all` is every scraped screening, `allWithMovieId` the ones that got matched to a movie (TMDB) and so show a poster and details. The difference is what `https://www.expatcinema.com/movie/unmatched` lists: screenings without a `movieId` in `screenings.json` (the page is rendered from that file, so compute it from the JSON). On 2026-10-03 that was 177 of 855 (20%), mostly Filmhuis Den Haag, Lantarenvenster, Lab111, Eye and Cinerama. Each week:

1. Report the share unmatched now, and compared with the weekly numbers of the previous 4 weeks (analytics `all` vs `allWithMovieId`, same weekday). A jump of more than 5 percentage points is a finding by itself: a scraper started returning different titles, or the metadata lookup (TMDB) is failing.
2. Group the unmatched titles per cinema and look for **repeating patterns in the title that don't belong to the film name**, which a scraper could strip (in its own `cleanTitle`) or the title normaliser could handle (`normalizeMovieTitleForLookup` in `cloud/metadata/titleResolver.ts`). Seen so far: festival or series in brackets or as suffix (`(Camera Japan)`, `| K-Wave`, `– Black Achievement Month`), a series before a colon (`Paff: Fjord (Eng Subs)`, `Film & Food: Shall We Dance? (Incl. Ramen)`, `Archined Classic: Hiroshima Mon Amour`), `+ Q&A` or `+ Nagesprek` add-ons, `(Eng Subs)` and similar markers, a leading `** `, `Aka` alternative titles. Prefer a fix in the scraper of the cinema that adds the pattern (that can be a PR); a pattern shared by several cinemas belongs in the normaliser, and a one-off wrong title in the manual overrides, but those live in `cloud/metadata/`, which this routine doesn't change: describe the proposed change in the thread for the maintainer.
3. For each pattern, say how many screenings and which cinemas it affects, and show the extraction as it should be (before and after, with 3 examples). Check the proposed cleaned title against TMDB or the cinema's film page before proposing it.
4. Separate what is **not** an extraction problem: events that aren't films (talks, festivals, `Surprise Film`, kids' programmes), films TMDB doesn't have, and ambiguous titles. Those stay unmatched. Propose a manual override (`cloud/metadata/manualTitleOverrides.ts`, with a note) only when the right film is certain.

A wrong match is worse than no match: it puts a different film's poster and details on a screening. Never loosen the matching to bring the share down. A PR that improves a pattern must keep the existing tests passing and add a test with the real titles it handles.

**Output:** one Slack message with the findings. Put the unmatched share and the title patterns that could be improved in the thread, under a _Matching_ heading, and mention the share in the top-level message when it jumped. For clear scraper bugs or a clear title pattern in a scraper the agent may open a PR with a fix, linked from the thread.

## Routine 3: Quarterly cinema discovery

**When:** 1 January, April, July and October, 05:15 UTC.

Look for cinemas in the Netherlands that show films with English subtitles but aren't scraped yet: search for "English subtitles" / "Engelse ondertiteling" / "expat cinema" programmes, Cineville cinemas, and film festivals. Skip cinemas already listed in `docs/cinema-research.md`. Report candidates in Slack, and open a PR adding the outcome to `docs/cinema-research.md`.

Also check the health of the code base itself (report only: don't change dependencies or code, and open no PR for it):

- **Deprecations.** The scrapers Lambda runs with `--no-deprecation` (`cloud/lib/backend-stack.ts`) because `x-ray` and its dependencies (unmaintained since 2022) trigger two Node deprecation warnings on every cold start: DEP0005 (`Buffer()`, from `http-outgoing`) and DEP0169 (`url.parse()`, from `x-ray`). That also hides new ones, so look for them here: install dependencies, then run `NODE_OPTIONS="--pending-deprecation --trace-deprecation" pnpm scraper:headless scrapers/<name>.ts` for `concordia` (x-ray), `kinorotterdam` (got) and `chasse` (Puppeteer), and `pnpm test` with the same `NODE_OPTIONS`, in `cloud/`. List every `DEP00xx` code other than the two above, with the package that triggers it (from the stack trace). Also check whether AWS has announced the end of support for the Lambda Node.js runtime in use (`NODEJS_24_X`).
- **Dependencies.** In `cloud/` and `web/`, run `pnpm outdated`. Report major versions that are out, anything that is deprecated or hasn't been published for over two years (`x-ray` and its dependencies are known), and for `x-ray` whether a maintained replacement or fork exists now. Also note `got`, `puppeteer`, `@sparticuz/chromium`, `next` and `react` even when only a minor version is out.

## Working on findings

- Fixing a scraper: follow `AGENTS.md` (run it with `pnpm scraper scrapers/<name>.ts`, add or update a test, open a PR). After merging, the maintainer runs `pnpm run scrapers:prod`.
- When a cinema's status changes, update the table below in the same PR.
- A scraper for a cinema that has no English-subtitled screenings yet (status `idle`) can be kept open as a PR with the label `waiting-for-screenings`, instead of being merged. The daily health check runs these scrapers and reports when one is ready to merge. Don't close these PRs as stale. Idle cinemas that are already merged stay listed on the site (an empty cinema shows "No screenings found in …"), so that visitors can still find their cinema.

## Cinema status

Baseline from the 29 runs between 2026-08-31 and 2026-09-28. Statuses: `ok` (monitored), `broken` (known broken, being fixed), `idle` (scraper works, but the cinema has no English-subtitled screenings right now; check again in the quarterly discovery).

| Scraper                  | Status | Notes (as of 2026-09-28)                        |
| ------------------------ | ------ | ----------------------------------------------- |
| amstelveen               | idle   | subs now in Production.Other; all NL (09-28)    |
| bioscopenleiden          | ok     | fixed 2026-09-28 ("ENGLISH SUBS" tag)           |
| castellum                | idle   | no English-subtitled films (2026-09-28)         |
| chasse                   | ok     | ok from AWS 2026-10-03 (Chromium + Chrome UA)   |
| cinecenter               | ok     |                                                 |
| cinecitta                | idle   | new domain (#375); no Eng-subs films (09-28)    |
| cinemadevlugt            | idle   | Expat Cinema list empty (2026-09-28)            |
| cinemathepulse           | ok     | fixed 2026-09-28 (URL marker changed)           |
| cinerama                 | ok     | fixed 2026-10-01: fetched via teatree relay     |
| concordia                | ok     |                                                 |
| debalie                  | ok     | added 2026-10-03; EN only when ENG is listed    |
| defilmhallen             | ok     |                                                 |
| desien                   | ok     | fixed 2026-09-28 (new English marker)           |
| deuitkijk                | ok     |                                                 |
| dewittdordrecht          | idle   | no Expat Cinema; all films NL subs (09-28)      |
| dokhuis                  | ok     | occasional: film nights with English subs       |
| eyefilm                  | ok     |                                                 |
| fchyena                  | ok     | ok from AWS 2026-10-03 (Framer); low: 1 EN film |
| filmhuisbreda            | ok     | fixed 2026-10-01: fetched via teatree relay     |
| filmhuisbussum           | idle   | no English-subtitled films (2026-09-28)         |
| filmhuiscavia            | ok     | added 2026-10-02; monthly programme pages       |
| filmhuisdenhaag          | ok     |                                                 |
| filmhuislumen            | ok     |                                                 |
| filmkoepel               | idle   | feed only; no EN-subbed films (2026-10-02)      |
| filmtheaterhilversum     | ok     | 503s from AWS; timeouts added (10-03)           |
| florafilmtheater         | ok     | fixed 2026-10-03: sold-out, 2+ showtimes/day    |
| focusarnhem              | ok     | fixed 2026-09-30 (new site, GraphQL API)        |
| forumgroningen           | ok     |                                                 |
| hartlooper               | ok     |                                                 |
| heerenstraattheater      | ok     | fixed 2026-10-01: fetched via teatree relay     |
| hetdocumentairepaviljoen | ok     | fixed 2026-09-28 (subtitle label changed)       |
| ketelhuis                | ok     | small (1–6); page blank 10-03 (their site)      |
| kinorotterdam            | ok     |                                                 |
| kriterion                | ok     |                                                 |
| lab1                     | ok     |                                                 |
| lab111                   | ok     |                                                 |
| lantarenvenster          | ok     | fell 115→45 on 28 Sep: real (checked 10-02)     |
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
| themovies                | idle   | no EN-subbed films (checked 2026-10-03)         |
| worm                     | ok     |                                                 |
