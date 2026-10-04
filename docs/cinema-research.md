# Cinema Research

This file tracks which cinemas in the Netherlands have been researched for screenings with English subtitles, and their outcome. Use it to avoid re-researching the same cinemas in future sessions.

---

## Already have scrapers

The canonical list of active scrapers is the `SCRAPERS` object in `cloud/scrapers/index.ts` — that is the source of truth. The table below is a human-readable reference; keep it in sync when adding or removing scrapers.

| Cinema                                      | City       | Scraper file                  |
| ------------------------------------------- | ---------- | ----------------------------- |
| Bioscopenleiden (Kijkhuis / Lido / Trianon) | Leiden     | `bioscopenleiden.ts`          |
| Cinecenter                                  | Amsterdam  | `cinecenter.ts`               |
| Cinecitta                                   | Utrecht    | `cinecitta.ts`                |
| Cinerama                                    | Rotterdam  | `cinerama.ts`                 |
| Concordia                                   | Enschede   | `concordia.ts`                |
| De Filmhallen                               | Amsterdam  | `defilmhallen.ts`             |
| De Uitkijk                                  | Amsterdam  | `deuitkijk.ts`                |
| Dokhuis                                     | Rotterdam  | `dokhuis.ts`                  |
| Eye Film                                    | Amsterdam  | `eyefilm.ts`                  |
| Filmhuis Den Haag                           | Den Haag   | `filmhuisdenhaag.ts`          |
| Filmhuis Lumen                              | Delft      | `filmhuislumen.ts`            |
| Filmkoepel                                  | Haarlem    | `filmkoepel.ts`               |
| Flora Filmtheater                           | Den Haag   | `florafilmtheater.ts`         |
| Focus                                       | Arnhem     | `focusarnhem.ts`              |
| Forum                                       | Groningen  | `forumgroningen.ts`           |
| Het Documentaire Paviljoen                  | Amsterdam  | `hetdocumentairepaviljoen.ts` |
| Ketelhuis                                   | Amsterdam  | `ketelhuis.ts`                |
| KINO                                        | Rotterdam  | `kinorotterdam.ts`            |
| Kriterion                                   | Amsterdam  | `kriterion.ts`                |
| LAB-1                                       | Eindhoven  | `lab1.ts`                     |
| LAB111                                      | Amsterdam  | `lab111.ts`                   |
| LantarenVenster                             | Rotterdam  | `lantarenvenster.ts`          |
| Louis Hartlooper Complex                    | Utrecht    | `hartlooper.ts`               |
| Lumière                                     | Maastricht | `lumiere.ts`                  |
| LUX                                         | Nijmegen   | `lux.ts`                      |
| Melkweg                                     | Amsterdam  | `melkweg.ts`                  |
| NatLab                                      | Eindhoven  | `natlab.ts`                   |
| Rialto (De Pijp + VU)                       | Amsterdam  | `rialto.ts`                   |
| De Schuur                                   | Haarlem    | `schuur.ts`                   |
| Slachtstraat                                | Utrecht    | `slachtstraat.ts`             |
| Springhaver                                 | Utrecht    | `springhaver.ts`              |
| Studio/K                                    | Amsterdam  | `studiok.ts`                  |
| The Movies                                  | Amsterdam  | `themovies.ts`                |

**Note:** `liff.ts` exists in the scrapers directory but is **not imported in `index.ts`** — it is inactive. LIFF (Leiden International Film Festival) is a seasonal multi-venue festival in Leiden.

---

## GitHub issues filed — awaiting scrapers

Cinemas confirmed to have screenings with English subtitles; GitHub issues created.

| Cinema                                      | City                           | Program                                              | Issue | URL                                                                           |
| ------------------------------------------- | ------------------------------ | ---------------------------------------------------- | ----- | ----------------------------------------------------------------------------- |
| Cinema de Vlugt                             | Amsterdam                      | "Expat Cinema" dedicated program                     | #174  | https://www.cinemadevlugt.nl/expat-cinema/                                    |
| FC Hyena                                    | Amsterdam                      | Per-film "Engels ondertiteld" label                  | #175  | https://fchyena.nl                                                            |
| Chassé Cinema                               | Breda                          | "Internationals Cinema Breda" (monthly)              | #176  | https://www.chasse.nl/nl/internationals-cinema-breda-chasse-cinema-breda-13gr |
| Filmtheater De Witt                         | Dordrecht                      | "Expat Cinema" (monthly, ~first Friday)              | #177  | https://www.dewittdordrecht.nl/filmtheater/expat-cinema-the-history-of-sound/ |
| Filmtheater Hilversum                       | Hilversum                      | "English subtitles / Lost in Translation" series     | #178  | https://filmtheaterhilversum.nl/specials/expat-cinema-lost-in-translation/    |
| Slieker Film                                | Leeuwarden                     | English subtitled every Wednesday                    | #179  | https://sliekerfilm.nl/englishsubs/                                           |
| De Sien                                     | Utrecht                        | "English Subs" filter/recurring program              | #180  | https://desienfilm.nl/films?filter=englishsubs&datum=alle-tijden              |
| Heerenstraat Theater                        | Wageningen                     | "Subtitle Sunday" (every Sunday)                     | #181  | https://www.heerenstraattheater.nl/subtitlesunday                             |
| WORM                                        | Rotterdam                      | "Filmtuin" outdoor cinema (June–July only, seasonal) | #182  | https://worm.org/2025/05/01/filmtuin-2025/                                    |
| Pathé (City AMS / Buitenhof DH / Eindhoven) | Amsterdam, Den Haag, Eindhoven | "Expat Night" (monthly, 3rd Thursday)                | #183  | https://en.pathe.nl/expatnight                                                |

---

## Quarterly discovery — 2026-10-01

Searched Cineville's full cinema directory (81 venues, via its JSON data endpoint) plus broad English/Dutch web search across the 25 largest Dutch cities, university towns, and festival listings. Covered the 5 Cineville cities with no prior research (Den Bosch, Oosterhout, Soest, Woerden, Zutphen) and double-checked Amsterdam, Rotterdam, Utrecht, Den Haag, Groningen and other already-covered cities for venues not yet recorded.

**Note — Cineville renames:** a few existing entries above now appear under different names on Cineville's current directory; these are the same venues, not new candidates: Filmhuis Breda → "Botanique", Cinema Enkhuizen → "De Drom", Filmhuis CineCast (Castricum) → "Corso Bioscoop", DaVinci Bioscoop/Cinema Goes → "Podium 't Beest", De Leuke Filmplek (Voorschoten) → "Filmtheater Voorschoten". "Dokhuis" (Rotterdam) and "Vera" (Groningen) no longer appear in Cineville's theater list.

### Candidate (regular, scrapeable)

| Cinema         | City      | Program                                          | Outcome   | URL                                                 | Evidence                                                                                                                                                                                                           | Scrape notes                                                                                 |
| -------------- | --------- | ------------------------------------------------ | --------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Filmhuis Cavia | Amsterdam | Per-film "EN subtitles" label, most of programme | candidate | https://www.filmhuiscavia.nl/programma/oktober-2026 | Oct 2026 programme labels most non-English/non-silent titles "EN subtitles", e.g. Cabra Marcado Para Morrer (Portuguese), Un lugar más grande (Spanish), The Summer with Carmen (Greek), L'Amour à la Mer (French) | Per-film label directly on monthly programme page (`/programma/<month-year>`); no API needed |

### Occasional

| Name                                     | City                                                | Outcome    | URL                                                                             | Evidence                                                                                                                                 | Notes                                                                                                                                      |
| ---------------------------------------- | --------------------------------------------------- | ---------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Verkadefabriek                           | Den Bosch                                           | occasional | https://www.verkadefabriek.nl/agenda                                            | Regular foreign films have Dutch subs only; summer "Buitenbios" outdoor series showed "Cinema Paradiso" (Italian) with English subtitles | Seasonal/occasional only, not a standing programme                                                                                         |
| Luxor Theater                            | Zutphen                                             | occasional | https://luxorzutphen.nl/films/                                                  | Festival/special screenings had English subtitles (silent film w/ live score, Kurdish Film Festival titles, 105th-anniversary classics)  | No standing weekly slot; wp-json API live at `/wp-json/` if ever worth scraping                                                            |
| Nederlands Film Festival                 | Utrecht                                             | occasional | https://www.filmfestival.nl/en/festival-2/plan-your-visit/tickets               | "Every day the festival screens films with Dutch and/or English subtitles"                                                               | Annual, ~1 week (late Sep–early Oct); mostly already-scraped venues (De Sien) plus Stadsschouwburg, Kinepolis Jaarbeurs, Bibliotheek Neude |
| Movies that Matter                       | Den Haag                                            | occasional | https://moviesthatmatter.nl/en/festival/programme/                              | Per-film pages show available subtitle languages                                                                                         | Annual (March); mostly already-excluded venues plus Theater aan het Spui, Theater Dakota, Theater de Regentes, Theater de Vaillant         |
| Eastern Neighbours Film Festival         | Den Haag (+ on tour: Amsterdam, Rotterdam, Utrecht) | occasional | https://easternneighboursfilmfestival.nl/on-tour/                               | "All films are screened with English subtitles"                                                                                          | Annual (Nov) at Filmhuis Den Haag (already scraped) + occasional on-tour screenings, mostly at already-scraped venues                      |
| Leiden Shorts                            | Leiden                                              | occasional | https://leidenshorts.nl                                                         | Submission rules require films to be available in English (spoken or subtitled)                                                          | Annual (end May/early June); venues incl. already-scraped Kijkhuis plus new Theater de Generator; via FilmChief platform                   |
| InScience Film Festival                  | Nijmegen (at LUX)                                   | occasional | https://insciencefestival.nl/en/about-inscience/                                | "Films must include English subtitles"                                                                                                   | Annual (March); primary venue LUX already scraped, but has own festival programme page                                                     |
| USVA (Cultureel Studentencentrum RUG)    | Groningen                                           | occasional | https://usva.nl/en/programma/                                                   | Recurring "Movie Night" and "Cinema Politica" events, distinct from already-scraped Forum Groningen                                      | WordPress site, `/wp-json/` REST API live; subtitle info not consistently stated per event                                                 |
| Flicks Int'l Student Short Film Festival | Groningen (at USVA)                                 | occasional | https://usva.nl/en/course-usva/flicks-international-student-short-film-festival | Entry rule requires English dialogue or subtitles                                                                                        | Annual (March, 4 days)                                                                                                                     |
| iAfrica Film Festival                    | Den Haag (base) + Groningen (USVA satellite)        | occasional | https://filmhuisdenhaag.nl/iafrica                                              | African cinema festival                                                                                                                  | Base venue already scraped (Filmhuis Den Haag); Groningen satellite is a single annual date                                                |

### No (checked, no English-subtitled screenings found)

| Name                                                        | City                | URL                                                                | Notes                                                                                                                                                    |
| ----------------------------------------------------------- | ------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Artishock                                                   | Soest               | https://www.artishocksoest.nl/film                                 | No subtitle/language labels found in listings                                                                                                            |
| AnnexCinema                                                 | Woerden             | https://www.annexcinema.nl/nl/programma                            | Per-film "Taal"/"Ondertiteling" fields exist in template but subtitles field never populated; worth a periodic recheck                                   |
| Theater Dakota                                              | Den Haag            | https://www.theaterdakota.nl/agenda/?type=film                     | No subtitle field on checked event pages (incl. non-English titles)                                                                                      |
| IFFR year-round programme                                   | Rotterdam / Tilburg | https://iffr.com/nl/jaarrond-programma                             | Mostly already-scraped venues; no subtitle info found for new venues (Pauluskerk, OASE, Fenix, Theater Zuidplein, Bibliotheek Rotterdam, De Pont Museum) |
| Fenix (Museum of Migration)                                 | Rotterdam           | https://rotterdam.info/en/visit/finder-locations/fenix             | New museum; occasional IFFR satellite venue but no dedicated English-subtitled film programme                                                            |
| Theater Zuidplein                                           | Rotterdam           | https://uitagendarotterdam.nl/locaties/locatie/theater-zuidplein   | Primarily theatre/dance/live-music venue, no regular film programme                                                                                      |
| USVA Bios                                                   | Groningen           | https://filmvandaag.nl/filmladder/115-usva-bios-groningen          | Dormant/inactive standalone cinema listing, distinct from USVA's event-based Movie Nights                                                                |
| ESN chapters (Amsterdam, Utrecht, Wageningen, Twente, etc.) | multiple            | esn-utrecht.nl, esnvuamsterdam.nl, esntwente.nl, esn-wageningen.nl | Casual English-language social movie nights; no subtitle/language metadata, not scrapeable as structured film data                                       |

### Blocked / inconclusive (site not reliably scrapeable at time of research)

| Name                      | City               | URL                                      | Notes                                                                                                                                                                                                                                                                                              |
| ------------------------- | ------------------ | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ventilator Cinema (OT301) | Amsterdam          | https://ot301.nl/agenda/                 | Site returned HTTP 503 "Service Temporarily Unavailable" on repeated fetch (confirmed independently 2026-10-01); search evidence (AmsterdamAlternative listings, etc.) suggests regular EN-subtitled non-English screenings (e.g. "Ikiru", Argentinian Movie Night) — recheck once site is back up |
| De Omval                  | Amsterdam (Diemen) | https://www.theaterdeomval.nl            | Infinite redirect loop (cookie-consent/bot-check wall) blocks automated fetch; third-party listing (filmladder.nl) shows foreign-language films but no subtitle data                                                                                                                               |
| Theater de Bussel         | Oosterhout         | https://www.theaterdebussel.nl/programma | Site heavily redirects (JS/cookie wall), blocking automated fetch; no subtitle/language labels found via search either                                                                                                                                                                             |

---

## Researched — confirmed no English subtitled screenings

Cinemas that were checked and confirmed to only show OV (original English audio + Dutch subtitles) or have no English subtitle program.

### Cineville cinemas

| Cinema                         | City        | Notes                                                   |
| ------------------------------ | ----------- | ------------------------------------------------------- |
| Filmhuis Alkmaar               | Alkmaar     | Arthouse/OV; no dedicated English subtitle program      |
| De Lieve Vrouw                 | Amersfoort  | Arthouse; no English subtitle program found             |
| Bijlmerbios                    | Amsterdam   | Films are mainly English-spoken with Dutch subtitles    |
| De Balie                       | Amsterdam   | Documentary/arthouse; no English subtitle program found |
| Filmhuis Bussum (De Vonk)      | Bussum      | Arthouse; OV with Dutch subtitles only                  |
| MIMIK                          | Deventer    | Active arthouse; no English subtitle program found      |
| Cacaofabriek                   | Helmond     | No English subtitle program found                       |
| De Leuke Filmplek              | Voorschoten | OV screenings of English-language films only            |
| Movie W                        | Wageningen  | Arthouse; no English subtitle program found             |
| De Fabriek                     | Zaandam     | Arthouse; no English subtitle program found             |
| Filmtheater Fraterhuis         | Zwolle      | No English subtitle program found                       |
| Ledeltheater                   | Oostburg    | Small regional venue; no English subtitle program found |
| DaVinci Bioscoop (Cinema Goes) | Goes        | More mainstream; no English subtitle program found      |

### Non-Cineville cinemas

| Cinema                                       | City                                   | Notes                                                          |
| -------------------------------------------- | -------------------------------------- | -------------------------------------------------------------- |
| Vue Cinemas (21 locations)                   | Multiple                               | OV only — English audio + Dutch subtitles                      |
| Kinepolis (17 locations, incl. former Wolff) | Multiple                               | OV only — English audio + Dutch subtitles                      |
| De Muze                                      | Noordwijk                              | OV only                                                        |
| Luxor Cinemas                                | Meppel, Steenwijk                      | OV only                                                        |
| C-Cinema                                     | Roosendaal, Bergen op Zoom, Etten-Leur | Bilingual Eng/NL audio on children's films; not relevant       |
| Filmhuis Dokkum                              | Dokkum                                 | Very small (bi-monthly); no English subtitle program found     |
| DNK Filmhuis                                 | Assen                                  | No English subtitle program found                              |
| Filmhuis Oldenzaal                           | Oldenzaal                              | No English subtitle program found                              |
| De Nieuwe Scene                              | Venlo                                  | No English subtitle program found                              |
| Vera Zienema                                 | Groningen                              | Weekly volunteer film night; no English subtitle program found |

---

## Researched — inconclusive (technical failure)

These cinemas could not be fully verified due to website issues at time of research. Worth re-checking before concluding they have no English subtitle program.

| Cinema                            | City       | Notes                                                                                   |
| --------------------------------- | ---------- | --------------------------------------------------------------------------------------- |
| Gigant                            | Apeldoorn  | Website returned 403 during research                                                    |
| Filmhuis CineCast                 | Castricum  | Very small seasonal operation (6 films/year); subtitle info not accessible              |
| Cinema Oostereiland (Krententuin) | Hoorn      | Agenda page did not load during research                                                |
| Aan de Slinger                    | Houten     | Small community cinema; subtitle info not accessible                                    |
| Haventheater IJmuiden             | IJmuiden   | Primarily theater venue; subtitle policy unclear                                        |
| Cinema Middelburg                 | Middelburg | Website timed out during research                                                       |
| Wenneker Cinema                   | Schiedam   | OV cinema; could not confirm whether non-English films with English subtitles are shown |
| Filmhuis Zevenaar                 | Zevenaar   | No language info in film listings                                                       |
| fiZi                              | Zierikzee  | No language tags in listings                                                            |
| Cinema Enkhuizen                  | Enkhuizen  | Website inaccessible (401) during research                                              |

---

## Notes

- **OV ≠ English subtitles.** "OV" (originele versie) at mainstream chains means English audio + Dutch subtitles. expatcinema.com targets non-English films with English subtitles. See CLAUDE.md for the full explanation.
- **Visum Mundi (Wageningen)** runs the same "Subtitle Sunday" program as Heerenstraat Theater — same organisation, same venue. Only one scraper needed (Heerenstraat Theater, issue #181).
- **Pathé Expat Night** — verify the program is still active at https://en.pathe.nl/expatnight before building the scraper.
- **WORM** — seasonal only (June–July). Consider whether a seasonal scraper is worth the effort.
