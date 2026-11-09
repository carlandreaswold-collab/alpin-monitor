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
