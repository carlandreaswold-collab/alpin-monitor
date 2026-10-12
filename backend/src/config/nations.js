// Land for utøver-filter. Koder er IOC (3 bokstaver). Ukjente koder får nøytralt flagg.
export const NATION_META = {
  NOR: ['🇳🇴', 'Norge'],      SWE: ['🇸🇪', 'Sverige'],     FIN: ['🇫🇮', 'Finland'],
  DEN: ['🇩🇰', 'Danmark'],    AUT: ['🇦🇹', 'Østerrike'],   SUI: ['🇨🇭', 'Sveits'],
  ITA: ['🇮🇹', 'Italia'],     FRA: ['🇫🇷', 'Frankrike'],   GER: ['🇩🇪', 'Tyskland'],
  USA: ['🇺🇸', 'USA'],        CAN: ['🇨🇦', 'Canada'],      SLO: ['🇸🇮', 'Slovenia'],
  SVK: ['🇸🇰', 'Slovakia'],   CRO: ['🇭🇷', 'Kroatia'],     GBR: ['🇬🇧', 'Storbritannia'],
  CZE: ['🇨🇿', 'Tsjekkia'],   BEL: ['🇧🇪', 'Belgia'],      ESP: ['🇪🇸', 'Spania'],
  AND: ['🇦🇩', 'Andorra'],    LIE: ['🇱🇮', 'Liechtenstein'], POL: ['🇵🇱', 'Polen'],
  BUL: ['🇧🇬', 'Bulgaria'],   LAT: ['🇱🇻', 'Latvia'],      EST: ['🇪🇪', 'Estland'],
  UKR: ['🇺🇦', 'Ukraina'],    TUR: ['🇹🇷', 'Tyrkia'],      GRE: ['🇬🇷', 'Hellas'],
  JPN: ['🇯🇵', 'Japan'],      KOR: ['🇰🇷', 'Sør-Korea'],   CHN: ['🇨🇳', 'Kina'],
  AUS: ['🇦🇺', 'Australia'],  NZL: ['🇳🇿', 'New Zealand'], BRA: ['🇧🇷', 'Brasil'],
  ARG: ['🇦🇷', 'Argentina'],  CHI: ['🇨🇱', 'Chile'],       LTU: ['🇱🇹', 'Litauen'],
  ROU: ['🇷🇴', 'Romania'],    HUN: ['🇭🇺', 'Ungarn'],      SRB: ['🇷🇸', 'Serbia'],
  BIH: ['🇧🇦', 'Bosnia'],     MKD: ['🇲🇰', 'Nord-Makedonia'], ISL: ['🇮🇸', 'Island'],
  IRL: ['🇮🇪', 'Irland'],     NED: ['🇳🇱', 'Nederland'],   LUX: ['🇱🇺', 'Luxembourg'],
  KAZ: ['🇰🇿', 'Kasakhstan'], GEO: ['🇬🇪', 'Georgia'],     ARM: ['🇦🇲', 'Armenia'],
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
  return { code, flag: m ? m[0] : '🏳️', name: m ? m[1] : code };
}
