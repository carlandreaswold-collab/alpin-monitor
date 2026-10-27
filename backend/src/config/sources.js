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

  // Expressen — generell sport (ingen alpint-feed), faktasjekk filtrerer bort rusk
  { id: 'expressen',  name: 'Expressen',   url: 'https://www.expressen.se/rss/sport',        type: 'rss', country: 'SWE', lang: 'sv' },

  // ── SLOVENIA ──
  // RTV SLO sport (feed 03) — generell sport, mest fotball/basket/sykling, faktasjekk filtrerer bort rusk
  { id: 'rtvslo',     name: 'RTV SLO',     url: 'https://img.rtvslo.si/feeds/03.xml',        type: 'rss', country: 'SLO', lang: 'sl' },

  // ── FRANKRIKE ──
  // franceinfo (France Télévisions) — dedikert ski alpin-feed, offentlig kringkaster
  { id: 'franceinfo', name: 'franceinfo',  url: 'https://www.franceinfo.fr/sports/sports-d-hiver/ski-alpin.rss', type: 'rss', country: 'FRA', lang: 'fr' },

  // ── TYSKLAND ──
  // Sportschau (ARD) — dedikert ski alpin-feed, offentlig kringkaster, solid redaksjon
  { id: 'sportschau', name: 'Sportschau',  url: 'https://www.sportschau.de/wintersport/ski-alpin/index~rss2.xml', type: 'rss', country: 'GER', lang: 'de' },

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
// Format: { name, aliases? } — aliases matcher i tillegg til name og etternavn
export const TRACKED_ATHLETES = [
  { name: 'Mikaela Shiffrin', nation: 'USA',            aliases: ['Shiffrin'] },
  { name: 'Marco Odermatt', nation: 'SUI',              aliases: ['Odermatt'] },
  { name: 'Henrik Kristoffersen', nation: 'NOR',        aliases: ['Kristoffersen'] },
  { name: 'Aleksander Aamodt Kilde', nation: 'NOR',     aliases: ['Kilde', 'Aamodt Kilde'] },
  { name: 'Lara Gut-Behrami', nation: 'SUI',            aliases: ['Gut-Behrami', 'Gut Behrami'] },
  { name: 'Sofia Goggia', nation: 'ITA',                aliases: ['Goggia'] },
  { name: 'Petra Vlhová', nation: 'SVK',                aliases: ['Vlhova', 'Vlhová'] },
  { name: 'Alexis Pinturault', nation: 'FRA',           aliases: ['Pinturault'] },
  { name: 'Lucas Braathen', nation: 'BRA',              aliases: ['Braathen'] },
  { name: 'Federica Brignone', nation: 'ITA',           aliases: ['Brignone'] },
  { name: 'Wendy Holdener', nation: 'SUI',              aliases: ['Holdener'] },
  { name: 'Marta Bassino', nation: 'ITA',              aliases: ['Bassino'] },
  { name: 'Clement Noel', nation: 'FRA',               aliases: ['Noël', 'Noel'] },
  { name: 'Manuel Feller', nation: 'AUT',              aliases: ['Feller'] },
  { name: 'Vincent Kriechmayr', nation: 'AUT',         aliases: ['Kriechmayr'] },
  { name: 'Ragnhild Mowinckel', nation: 'NOR',         aliases: ['Mowinckel'] },
  { name: 'Kajsa Vickhoff Lie', nation: 'NOR',         aliases: ['Vickhoff Lie'] },
  { name: 'Thea Louise Stjernesund', nation: 'NOR',    aliases: ['Stjernesund'] },
  { name: 'Marco Schwarz', nation: 'AUT',              aliases: ['Schwarz'] },
  { name: 'Stefan Rogentin', nation: 'SUI',            aliases: ['Rogentin'] },
  { name: 'Tessa Worley', nation: 'FRA',             aliases: ['Worley'] },
  { name: 'Valérie Grenier', nation: 'CAN',          aliases: ['Grenier'] },
  { name: 'Laurence St-Germain', nation: 'CAN',      aliases: ['St-Germain', 'Saint-Germain'] },
  { name: 'Lena Dürr', nation: 'GER',                 aliases: ['Dürr', 'Duerr'] },
  { name: 'Emma Aicher', nation: 'GER',               aliases: ['Aicher'] },
  { name: 'Josef Ferstl', nation: 'GER',              aliases: ['Ferstl'] },
  { name: 'Timon Haugan', nation: 'NOR',              aliases: ['Haugan'] },
  { name: 'Rasmus Windingstad', nation: 'NOR',        aliases: ['Windingstad'] },
  { name: 'Sebastian Foss-Solevåg', nation: 'NOR',    aliases: ['Foss-Solevåg'] },
  { name: 'Alexander Steen Olsen', nation: 'NOR',     aliases: ['Steen Olsen'] },
  { name: 'Maria Therese Tviberg', nation: 'NOR',     aliases: ['Tviberg'] },
  { name: 'Mina Fürst Holtmann', nation: 'NOR',       aliases: ['Fürst Holtmann', 'Holtmann'] },
  { name: 'Atle Lie McGrath', nation: 'NOR',           aliases: ['McGrath', 'Atle McGrath'] },
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
