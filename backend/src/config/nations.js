// Land for utøver-filter. Koder er IOC (3 bokstaver). Ukjente koder får nøytralt flagg.
export const NATION_META = {
  NOR: ['🇳🇴', 'Norge', 'no'],      SWE: ['🇸🇪', 'Sverige', 'se'],     FIN: ['🇫🇮', 'Finland', 'fi'],
  DEN: ['🇩🇰', 'Danmark', 'dk'],    AUT: ['🇦🇹', 'Østerrike', 'at'],   SUI: ['🇨🇭', 'Sveits', 'ch'],
  ITA: ['🇮🇹', 'Italia', 'it'],     FRA: ['🇫🇷', 'Frankrike', 'fr'],   GER: ['🇩🇪', 'Tyskland', 'de'],
  USA: ['🇺🇸', 'USA', 'us'],        CAN: ['🇨🇦', 'Canada', 'ca'],      SLO: ['🇸🇮', 'Slovenia', 'si'],
  SVK: ['🇸🇰', 'Slovakia', 'sk'],   CRO: ['🇭🇷', 'Kroatia', 'hr'],     GBR: ['🇬🇧', 'Storbritannia', 'gb'],
  CZE: ['🇨🇿', 'Tsjekkia', 'cz'],   BEL: ['🇧🇪', 'Belgia', 'be'],      ESP: ['🇪🇸', 'Spania', 'es'],
  AND: ['🇦🇩', 'Andorra', 'ad'],    LIE: ['🇱🇮', 'Liechtenstein', 'li'], POL: ['🇵🇱', 'Polen', 'pl'],
  BUL: ['🇧🇬', 'Bulgaria', 'bg'],   LAT: ['🇱🇻', 'Latvia', 'lv'],      EST: ['🇪🇪', 'Estland', 'ee'],
  UKR: ['🇺🇦', 'Ukraina', 'ua'],    TUR: ['🇹🇷', 'Tyrkia', 'tr'],      GRE: ['🇬🇷', 'Hellas', 'gr'],
  JPN: ['🇯🇵', 'Japan', 'jp'],      KOR: ['🇰🇷', 'Sør-Korea', 'kr'],   CHN: ['🇨🇳', 'Kina', 'cn'],
  AUS: ['🇦🇺', 'Australia', 'au'],  NZL: ['🇳🇿', 'New Zealand', 'nz'], BRA: ['🇧🇷', 'Brasil', 'br'],
  ARG: ['🇦🇷', 'Argentina', 'ar'],  CHI: ['🇨🇱', 'Chile', 'cl'],       LTU: ['🇱🇹', 'Litauen', 'lt'],
  ROU: ['🇷🇴', 'Romania', 'ro'],    HUN: ['🇭🇺', 'Ungarn', 'hu'],      SRB: ['🇷🇸', 'Serbia', 'rs'],
  BIH: ['🇧🇦', 'Bosnia', 'ba'],     MKD: ['🇲🇰', 'Nord-Makedonia', 'mk'], ISL: ['🇮🇸', 'Island', 'is'],
  IRL: ['🇮🇪', 'Irland', 'ie'],     NED: ['🇳🇱', 'Nederland', 'nl'],   LUX: ['🇱🇺', 'Luxembourg', 'lu'],
  ALB: ['🇦🇱', 'Albania', 'al'],
  KAZ: ['🇰🇿', 'Kasakhstan', 'kz'], GEO: ['🇬🇪', 'Georgia', 'ge'],     ARM: ['🇦🇲', 'Armenia', 'am'],
};

// ISO/ULIK skrivemåte → IOC
const ALIASES = {
  DEU: 'GER', DE: 'GER', CHE: 'SUI', CH: 'SUI', AT: 'AUT', IT: 'ITA', FR: 'FRA', NO: 'NOR',
  SE: 'SWE', FI: 'FIN', DK: 'DEN', DNK: 'DEN', US: 'USA', CA: 'CAN', SI: 'SLO', SVN: 'SLO',
  SK: 'SVK', HR: 'CRO', HRV: 'CRO', UK: 'GBR', GB: 'GBR', CZ: 'CZE', BE: 'BEL', ES: 'ESP',
  BG: 'BUL', BGR: 'BUL', LV: 'LAT', LVA: 'LAT', EE: 'EST', JP: 'JPN', KR: 'KOR', CN: 'CHN',
  AU: 'AUS', NZ: 'NZL', BR: 'BRA', AR: 'ARG', CL: 'CHI', CHL: 'CHI', GR: 'GRE', GRC: 'GRE',
  NL: 'NED', NLD: 'NED', IS: 'ISL', IE: 'IRL', PL: 'POL', UA: 'UKR', TR: 'TUR',
};

export function normalizeNation(code) {
  const c = String(code || '').trim().toUpperCase();
  if (!/^[A-Z]{2,3}$/.test(c)) return null;
  return ALIASES[c] || c;
}

export function nationInfo(code) {
  const m = NATION_META[code];
  return { code, flag: m ? m[0] : '🏳️', name: m ? m[1] : code, iso: m ? m[2] : null };
}
