# Notater

## 2026-10-22 — Kategoriserte saker forsvinner aldri

Commit `9ed1d6c`.

**Problem:** Saker som var merket og sortert i kategoriboksene forsvant etter henting av nye saker.

**Årsak:** Ingenting ble slettet fra databasen. Feeden viste bare de 80 nyeste sakene og snapshot-siden de 120 nyeste, så gamle merkede saker falt ut av listen.

**Løsning:** `getRecentArticles` (`backend/src/db/index.js`) og snapshot (`backend/src/snapshot/index.js`) tar alltid med alle saker som har kategori, uavhengig av alder, faktasjekk og duplikat-status.

**Merk:** En kategorisert sak som senere avvises av faktasjekken eller merkes som duplikat, blir likevel liggende i boksen.
