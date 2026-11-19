# Notater

## 2026-10-22 — Kategoriserte saker forsvinner aldri

Commit `9ed1d6c`.

**Problem:** Saker som var merket og sortert i kategoriboksene forsvant etter henting av nye saker.

**Årsak:** Ingenting ble slettet fra databasen. Feeden viste bare de 80 nyeste sakene og snapshot-siden de 120 nyeste, så gamle merkede saker falt ut av listen.

**Løsning:** `getRecentArticles` (`backend/src/db/index.js`) og snapshot (`backend/src/snapshot/index.js`) tar alltid med alle saker som har kategori, uavhengig av alder, faktasjekk og duplikat-status.

**Merk:** En kategorisert sak som senere avvises av faktasjekken eller merkes som duplikat, blir likevel liggende i boksen.

## 2026-11-09 — Uoversatte saker (Neveitalia på italiensk, uten sammendrag)

Commit `8428a45`.

**Problem:** Nesten alt fra Neveitalia (og tre fra Ski Racing) stod på originalspråket uten sammendrag.

**Årsak:** `translatePending` tok bare 100 saker per runde (`getUntranslated(limit = 100)`), mens hentingen ga 114. De 14 siste ble ikke oversatt. Feeden viser saker med `fact_ok IS NULL`, så de dukket opp uoversatt. Alle hadde samme `fetched_at`, så hvilke som falt utenfor var tilfeldig.

**Løsning:**
1. `translatePending` (`backend/src/translate/index.js`) gjentar til køen er tom. Den avbryter hvis en runde ikke oversetter noe, så gateway-feil ikke gir evig løkke.
2. `queryArticles` (`backend/src/db/index.js`) krever `a.translated = 1` for ikke-kategoriserte saker. Kategoriserte saker vises fortsatt uansett.

**Verifisert:** Etter restart ble de 15 restsakene oversatt, og `uoversatt: 0`. Ikke testet mot en full runde med over 100 nye saker.

**Annet 2026-11-09:**
- Gateway er nå `http://litellm.internal.nrk-coder.dev:4000` (var `10.10.0.10`). AI-stegene bruker `claude-sonnet-4-6`. «Haiku» i loggen er bare gammel tekst.
- API-nøkkelen skal ha utløpt, men oversetting, faktasjekk, tagging og spik fungerte likevel. Årsak uavklart (annen nøkkel eller ikke håndhevet). Sjekk utløpsdato i LiteLLM-admin hvis AI-stegene plutselig feiler.
- 10 kilder, inkludert Expressen og RTV SLO.

## 2026-11-19 – Spik-listen scroller

`.sidebar-col` (`frontend/src/index.css`) fikk `max-height: calc(100vh - 113px)` og `overflow-y: auto`, så lange spik-lister kan scrolles uavhengig av feeden. Commit `7a90a2f`. Bygget med `npm run build` uten restart av PM2. Ikke testet i nettleser.

## 2026-11-19 – Automatisk push til GitHub slått av (venter på restart)

Alpin Monitor skal kjøres agentisk på en NRK-maskin, og backend skal ikke lenger pushe snapshot til GitHub hvert kvarter.

- **Endret:** `backend/src/snapshot/index.js`: commit/push skjer nå bare hvis miljøvariabelen `SNAPSHOT_PUSH=1` er satt (som i langrenns-monitoren). Standard er av. Filene `docs/index.html`, `saker.csv` og `saker.json` skrives fortsatt lokalt (andre verktøy leser dem), men git røres ikke. Gjelder både kvartersjobben og Hent-knappen (begge går via `runFetch`).
- **Status:** restartet 19.11. kl. ca. 11:03 og testet med manuell henting: loggen sier «Snapshot skrevet lokalt (ingen commit/push)», ingen ny commit, HEAD = origin/main.
- **Slå push på igjen:** sett `SNAPSHOT_PUSH=1` i miljøet til PM2-prosessen og restart.
- Ikke committet.

## 2026-11-19 (senere) – Snapshot-push slått på igjen

NRK-maskin-oppsettet ble ikke helt klart, så push er på igjen: PM2-prosessen `alpin-monitor` er restartet med `SNAPSHOT_PUSH=1` (`pm2 restart alpin-monitor --update-env`) og lagret med `pm2 save`, så den overlever omstart av maskinen. Koden er uendret (bryteren fra 030d916 ligger der fortsatt). Slå av igjen: restart uten variabelen og `pm2 save` (eller `SNAPSHOT_PUSH=0`).
