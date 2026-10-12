// Maskinlesbar eksport av alle godkjente saker (docs/saker.csv + docs/saker.json),
// ment for Google Sheets (IMPORTDATA / Apps Script). Norske kolonnenavn uten æøå, så de er trygge i formler.

const COLUMNS = ['id', 'publisert', 'kilde', 'kilde_land', 'tittel', 'ingress', 'spik', 'utovere', 'land', 'kategori', 'flere_kilder', 'url']

// Publiseringstid i norsk tid, "yyyy-mm-dd HH:mm" — Sheets tolker det som dato+tid
function osloTime(iso) {
  const d = new Date(iso)
  if (!iso || isNaN(d)) return ''
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Europe/Oslo', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(d).map(x => [x.type, x.value])
  )
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`
}

const uniq = list => [...new Set(list)]

export function toRecord(a) {
  const iso = a.pub_date || a.fetched_at
  return {
    id: a.id,
    publisert: osloTime(iso),
    publisert_iso: iso ? new Date(iso).toISOString() : '',
    kilde: a.source_name || '',
    kilde_land: a.country || '',
    tittel: a.title_no || a.title_orig || '',
    ingress: a.summary_no || '',
    spik: a.spik_no || '',
    utovere: uniq((a.athletes || '').split(',').map(s => s.trim()).filter(Boolean)),
    land: uniq(a.athlete_nations || []),
    kategori: a.category || '',
    flere_kilder: a.also_sources || [],
    url: a.url || '',
  }
}

function csvCell(v) {
  const s = (Array.isArray(v) ? v.join('; ') : String(v ?? '')).replace(/\s*[\r\n]+\s*/g, ' ')
  return /[",;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function buildCsv(records) {
  const lines = [COLUMNS.join(',')]
  for (const r of records) lines.push(COLUMNS.map(c => csvCell(r[c])).join(','))
  return lines.join('\n') + '\n'
}

export function buildJson(records, updatedAtIso) {
  return JSON.stringify({ oppdatert: updatedAtIso, antall: records.length, saker: records }, null, 1) + '\n'
}
