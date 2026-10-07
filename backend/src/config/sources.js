// Overvåkede nyhetskilder — kun RSS-feeder som virker (sjekket 2026-10-07)
export const SOURCES = [
  // ── INTERNASJONALT ──
  { id: 'skiracing',  name: 'Ski Racing',  url: 'https://skiracing.com/feed/',              type: 'rss', country: 'INT', lang: 'en' },

  // ── ITALIA ──
  { id: 'neveitalia', name: 'Neveitalia',  url: 'https://www.neveitalia.it/feed/',           type: 'rss', country: 'ITA', lang: 'it' },

  // ── SVEITS ──
  { id: 'skinews',    name: 'SkinEWS',     url: 'https://www.skinews.ch/feed/',              type: 'rss', country: 'SUI', lang: 'de' },

  // ── NORGE ──
  // VG har alpint-tag-filter — lite innhold utenfor sesong, men relevant i sesong
  { id: 'vg',         name: 'VG',          url: 'https://www.vg.no/rss/feed/?categories=sport&tags=alpint', type: 'rss', country: 'NOR', lang: 'no' },

  // ── ØSTERRIKE ──
  // ORF Sport er generell sport — faktasjekk filtrerer bort rusk
  { id: 'orf',        name: 'ORF Sport',   url: 'https://rss.orf.at/sport.xml',              type: 'rss', country: 'AUT', lang: 'de' },

  // ── SVERIGE ──
  // SVT Sport er generell sport — faktasjekk filtrerer bort rusk
  { id: 'svt',        name: 'SVT Sport',   url: 'https://www.svt.se/sport/rss.xml',          type: 'rss', country: 'SWE', lang: 'sv' },

  // ── DEAD PER 2026-10-07 (fjernet) ──
  // FIS             https://www.fis-ski.com/DB/general/rss.html      → 404
  // Eurosport EN    https://www.eurosport.com/ski-alpine/rss.xml      → 404
  // Skiweltcup.tv   https://www.skiweltcup.tv/feed/                   → timeout
  // ski.no          https://www.ski.no/nyheter/?format=rss            → DNS feil
  // Dagbladet       https://www.dagbladet.no/sport/rss                → 404
  // Nettavisen      https://www.nettavisen.no/rss/sport               → XML-feil
  // ÖSV             https://www.oesv.at/rss/news.xml                  → 404
  // Krone           https://www.krone.at/rss/sport                    → 404
  // Swiss Ski       https://www.swisski.ch/de/news/rss                → 404
  // SRF Sport       https://www.srf.ch/sport/qs/rss/sport.rss         → 404
  // FISI            https://www.fisi.org/it/news/rss                  → 503
  // L'Équipe        https://www.lequipe.fr/rss/actu_rss_ski-alpin.xml → 403
  // Eurosport FR    https://www.eurosport.fr/ski-alpin/rss.xml        → 404
];

// Utøvere vi sporer spesielt (for auto-tagging)
export const TRACKED_ATHLETES = [
  'Mikaela Shiffrin', 'Marco Odermatt', 'Henrik Kristoffersen',
  'Aleksander Aamodt Kilde', 'Lara Gut-Behrami', 'Sofia Goggia',
  'Petra Vlhová', 'Alexis Pinturault', 'Lucas Braathen',
  'Federica Brignone', 'Wendy Holdener', 'Marta Bassino',
  'Clement Noel', 'Manuel Feller', 'Vincent Kriechmayr',
  'Ragnhild Mowinckel', 'Kajsa Vickhoff Lie', 'Thea Louise Stjernesund',
  'Marco Schwarz', 'Stefan Rogentin', 'Atle Lie McGrath',
];

// Nasjoner for auto-tagging
export const NATIONS = {
  NOR: ['Norge', 'Norway', 'Norvegia', 'Norwegen', 'Norvège'],
  AUT: ['Østerrike', 'Austria', 'Österreich', 'Autriche'],
  SUI: ['Sveits', 'Switzerland', 'Schweiz', 'Suisse', 'Svizzera'],
  ITA: ['Italia', 'Italy', 'Italien', 'Italie'],
  FRA: ['Frankrike', 'France', 'Frankreich'],
  USA: ['USA', 'United States', 'Amerika'],
  GER: ['Tyskland', 'Germany', 'Deutschland', 'Allemagne'],
  SWE: ['Sverige', 'Sweden', 'Schweden', 'Suède'],
  SVK: ['Slovakia', 'Slowakei'],
  SLO: ['Slovenia', 'Slovenien', 'Slowenien'],
};
