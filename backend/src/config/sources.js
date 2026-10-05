// Alle overvåkede kilder. type: 'rss' | 'scrape' (scraping kommer i neste runde)
export const SOURCES = [
  // ── INTERNASJONALT / FIS ──
  { id: 'fis',         name: 'FIS',            url: 'https://www.fis-ski.com/DB/general/rss.html',                          type: 'rss',    country: 'INT',  lang: 'en' },
  { id: 'skiracing',   name: 'Ski Racing',     url: 'https://skiracing.com/feed/',                                          type: 'rss',    country: 'USA',  lang: 'en' },
  { id: 'eurosport',   name: 'Eurosport',      url: 'https://www.eurosport.com/ski-alpine/rss.xml',                         type: 'rss',    country: 'INT',  lang: 'en' },
  { id: 'skiweltcup',  name: 'Skiweltcup.tv',  url: 'https://www.skiweltcup.tv/feed/',                                      type: 'rss',    country: 'INT',  lang: 'de' },

  // ── NORGE ──
  { id: 'skino',       name: 'ski.no',         url: 'https://www.ski.no/nyheter/?format=rss',                               type: 'rss',    country: 'NOR',  lang: 'no' },
  { id: 'vg',          name: 'VG',             url: 'https://www.vg.no/rss/feed/?categories=sport&tags=alpint',             type: 'rss',    country: 'NOR',  lang: 'no' },
  { id: 'dagbladet',   name: 'Dagbladet',      url: 'https://www.dagbladet.no/sport/rss',                                   type: 'rss',    country: 'NOR',  lang: 'no' },
  { id: 'nettavisen',  name: 'Nettavisen',     url: 'https://www.nettavisen.no/rss/sport',                                  type: 'rss',    country: 'NOR',  lang: 'no' },

  // ── ØSTERRIKE ──
  { id: 'oesv',        name: 'ÖSV',            url: 'https://www.oesv.at/rss/news.xml',                                     type: 'rss',    country: 'AUT',  lang: 'de' },
  { id: 'orf',         name: 'ORF Sport',      url: 'https://rss.orf.at/sport.xml',                                         type: 'rss',    country: 'AUT',  lang: 'de' },
  { id: 'krone',       name: 'Krone',          url: 'https://www.krone.at/rss/sport',                                       type: 'rss',    country: 'AUT',  lang: 'de' },

  // ── SVEITS ──
  { id: 'swisski',     name: 'Swiss Ski',      url: 'https://www.swisski.ch/de/news/rss',                                   type: 'rss',    country: 'SUI',  lang: 'de' },
  { id: 'srf',         name: 'SRF Sport',      url: 'https://www.srf.ch/sport/qs/rss/sport.rss',                            type: 'rss',    country: 'SUI',  lang: 'de' },

  // ── ITALIA ──
  { id: 'fisi',        name: 'FISI',           url: 'https://www.fisi.org/it/news/rss',                                     type: 'rss',    country: 'ITA',  lang: 'it' },

  // ── FRANKRIKE ──
  { id: 'lequipe',     name: "L'Équipe",       url: 'https://www.lequipe.fr/rss/actu_rss_ski-alpin.xml',                    type: 'rss',    country: 'FRA',  lang: 'fr' },
  { id: 'eurosportfr', name: 'Eurosport FR',   url: 'https://www.eurosport.fr/ski-alpin/rss.xml',                           type: 'rss',    country: 'FRA',  lang: 'fr' },

  // ── SVERIGE ──
  { id: 'svt',         name: 'SVT Sport',      url: 'https://www.svt.se/sport/rss.xml',                                     type: 'rss',    country: 'SWE',  lang: 'sv' },

  // ── SIDER UTEN RSS — scraping kommer i neste runde ──
  // { id: 'neveitalia',  name: 'Neveitalia',     url: 'https://www.neveitalia.it',                                            type: 'scrape', country: 'ITA',  lang: 'it' },
  // { id: 'skinews',     name: 'SkinEWS',        url: 'https://www.skinews.ch',                                              type: 'scrape', country: 'SUI',  lang: 'de' },
];

// Utøvere vi sporer spesielt (for auto-tagging)
export const TRACKED_ATHLETES = [
  'Mikaela Shiffrin', 'Marco Odermatt', 'Henrik Kristoffersen',
  'Aleksander Aamodt Kilde', 'Lara Gut-Behrami', 'Sofia Goggia',
  'Petra Vlhová', 'Alexis Pinturault', 'Lucas Braathen',
  'Federica Brignone', 'Wendy Holdener', 'Marta Bassino',
  'Clement Noel', 'Manuel Feller', 'Vincent Kriechmayr',
  'Ragnhild Mowinckel', 'Kajsa Vickhoff Lie', 'Thea Louise Stjernesund',
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
};
