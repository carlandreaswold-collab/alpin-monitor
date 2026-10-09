// FIS Alpine World Cup 2026-27 — nøkkelrenn
// Datoer er rennets første dag (fredag/lørdag). Format: YYYY-MM-DD
export const SEASON = {
  name: '2026-27',
  start: '2026-10-24', // Sölden
  end:   '2027-03-21', // Finale Soldeu (est.)
  races: [
    { date: '2026-10-24', end: '2026-10-26', venue: 'Sölden',        country: 'AUT', disciplines: ['GS'] },
    { date: '2026-11-14', end: '2026-11-16', venue: 'Levi',           country: 'FIN', disciplines: ['SL'] },
    { date: '2026-11-22', end: '2026-11-23', venue: 'Gurgl',          country: 'AUT', disciplines: ['GS', 'SL'] },
    { date: '2026-11-28', end: '2026-11-30', venue: 'Beaver Creek',   country: 'USA', disciplines: ['DH', 'SG', 'GS'] },
    { date: '2026-12-05', end: '2026-12-07', venue: 'Killington',     country: 'USA', disciplines: ['GS', 'SL'] },
    { date: '2026-12-12', end: '2026-12-14', venue: 'Val d\'Isère',   country: 'FRA', disciplines: ['DH', 'SG', 'GS'] },
    { date: '2026-12-19', end: '2026-12-21', venue: 'Courchevel',     country: 'FRA', disciplines: ['SL', 'GS'] },
    { date: '2027-01-04', end: '2027-01-05', venue: 'Zagreb',         country: 'CRO', disciplines: ['SL'] },
    { date: '2027-01-09', end: '2027-01-12', venue: 'Adelboden',      country: 'SUI', disciplines: ['GS', 'SL'] },
    { date: '2027-01-16', end: '2027-01-19', venue: 'Kitzbühel',      country: 'AUT', disciplines: ['DH', 'SG', 'SL', 'Kombinert'] },
    { date: '2027-01-23', end: '2027-01-25', venue: 'Wengen',         country: 'SUI', disciplines: ['DH', 'SL', 'Kombinert'] },
    { date: '2027-01-30', end: '2027-02-01', venue: 'Schladming',     country: 'AUT', disciplines: ['SL'] },
    { date: '2027-02-06', end: '2027-02-08', venue: 'Garmisch',       country: 'GER', disciplines: ['DH', 'SG'] },
    { date: '2027-02-13', end: '2027-02-15', venue: 'Méribel',        country: 'FRA', disciplines: ['GS', 'SL'] },
    { date: '2027-03-12', end: '2027-03-14', venue: 'Kvitfjell',      country: 'NOR', disciplines: ['DH', 'SG', 'GS'] },
    { date: '2027-03-19', end: '2027-03-21', venue: 'Soldeu',         country: 'AND', disciplines: ['SL', 'GS', 'Finale'] },
  ],
}

const DISC_SHORT = { DH: 'Utfor', SG: 'Super-G', GS: 'Storslalåm', SL: 'Slalåm', Kombinert: 'Kombinert', Finale: 'Finale' }

export function getSeasonStatus(now = new Date()) {
  const today = now.toISOString().slice(0, 10)

  // Er vi midt i et renn?
  const current = SEASON.races.find(r => today >= r.date && today <= r.end)
  if (current) {
    return {
      phase: 'race',
      label: `🏁 Renn nå — ${current.venue}`,
      detail: current.disciplines.map(d => DISC_SHORT[d] || d).join(' · '),
      race: current,
      daysUntil: 0,
    }
  }

  // Er vi i sesong?
  if (today >= SEASON.start && today <= SEASON.end) {
    const next = SEASON.races.find(r => r.date > today)
    if (next) {
      const days = Math.ceil((new Date(next.date) - now) / 86400000)
      return {
        phase: 'season',
        label: `⛷ Sesong pågår`,
        detail: `Neste: ${next.venue} om ${days} dag${days !== 1 ? 'er' : ''}`,
        race: next,
        daysUntil: days,
      }
    }
    return { phase: 'season', label: '⛷ Sesong pågår', detail: 'Siste renn passert', race: null, daysUntil: 0 }
  }

  // Forsesong (innen 30 dager til start) eller sommerpause
  const next = SEASON.races.find(r => r.date > today)
  if (next) {
    const days = Math.ceil((new Date(next.date) - now) / 86400000)
    if (days <= 45) {
      return {
        phase: 'preseason',
        label: `🎿 Forsesong`,
        detail: `${next.venue} om ${days} dag${days !== 1 ? 'er' : ''}`,
        race: next,
        daysUntil: days,
      }
    }
    return {
      phase: 'offseason',
      label: `💤 Sommerpause`,
      detail: `Sesong starter om ${days} dager`,
      race: next,
      daysUntil: days,
    }
  }

  return { phase: 'offseason', label: '💤 Av-sesong', detail: '', race: null, daysUntil: null }
}

// Returner renn som overlapper med en gitt dato-streng
export function getRaceForDate(dateStr) {
  if (!dateStr) return null
  const day = dateStr.slice(0, 10)
  return SEASON.races.find(r => day >= r.date && day <= r.end) || null
}
