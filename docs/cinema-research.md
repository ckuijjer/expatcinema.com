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
