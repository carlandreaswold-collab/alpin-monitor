const BASE = '/api'

function minsAgo(n) { return new Date(Date.now() - n * 60000).toISOString() }

const MOCK_ARTICLES = [
  { id: 1,  source_name: 'ski.no',     country: 'NOR', lang_orig: 'no', title_no: 'Braathen bekrefter: Stiller for Brasil i Sölden 26. oktober', url: '#', pub_date: minsAgo(12),  athletes: 'Lucas Braathen', category: null },
  { id: 2,  source_name: 'FIS',        country: 'INT', lang_orig: 'en', title_no: 'FIS bekrefter startliste Sölden — 83 utøvere påmeldt storslalåm', title_orig: 'FIS releases Sölden entry list: 83 athletes registered for giant slalom', url: '#', pub_date: minsAgo(28),  athletes: null, category: null },
  { id: 3,  source_name: 'VG',         country: 'NOR', lang_orig: 'no', title_no: 'Kilde om comebacket: – Kroppen responderer bedre enn jeg torde håpe', url: '#', pub_date: minsAgo(45),  athletes: 'Aleksander Aamodt Kilde', category: null },
  { id: 4,  source_name: 'ÖSV',        country: 'AUT', lang_orig: 'de', title_no: 'Kriechmayr: «Formen er på topp — klar for å angripe Odermatt»', title_orig: 'Kriechmayr: «Form stimmt – bereit, Odermatt anzugreifen»', url: '#', pub_date: minsAgo(67),  athletes: 'Vincent Kriechmayr', category: null },
  { id: 5,  source_name: 'Eurosport',  country: 'INT', lang_orig: 'en', title_no: 'Odermatt jakter tredje strake storskule-seier i Sölden', title_orig: 'Odermatt goes for third straight Sölden GS win', url: '#', pub_date: minsAgo(83),  athletes: 'Marco Odermatt', category: null },
  { id: 6,  source_name: 'SRF',        country: 'SUI', lang_orig: 'de', title_no: 'Lara Gut-Behrami: «Jeg er sulten etter VM-gullet — vil vinne alt»', title_orig: 'Lara Gut-Behrami: «Ich bin hungrig nach WM-Gold – will alles gewinnen»', url: '#', pub_date: minsAgo(104), athletes: 'Lara Gut-Behrami', category: null },
  { id: 7,  source_name: 'NRK',        country: 'NOR', lang_orig: 'no', title_no: 'Kristoffersen varsler slalåmsatsing: – Cupen er mitt mål', url: '#', pub_date: minsAgo(118), athletes: 'Henrik Kristoffersen', category: null },
  { id: 8,  source_name: "L'Équipe",   country: 'FRA', lang_orig: 'fr', title_no: 'Clément Noël: – Denne sesongen skal jeg endelig innfri forventningene', title_orig: 'Clément Noël: «Cette saison, je vais enfin tenir mes promesses»', url: '#', pub_date: minsAgo(142), athletes: 'Clément Noël', category: null },
  { id: 9,  source_name: 'Krone',      country: 'AUT', lang_orig: 'de', title_no: 'Hirscher med Nederland i Sölden — langer ut mot FIS-regelverket', title_orig: 'Hirscher mit den Niederlanden in Sölden – schießt gegen FIS-Regeln', url: '#', pub_date: minsAgo(159), athletes: 'Marcel Hirscher', category: null },
  { id: 10, source_name: 'Eurosport',  country: 'INT', lang_orig: 'en', title_no: 'Shiffrin returnerer: Første renn siden kneskaden i januar', title_orig: 'Shiffrin returns: First race since January knee injury', url: '#', pub_date: minsAgo(177), athletes: 'Mikaela Shiffrin', category: null },
  { id: 11, source_name: 'FIS',        country: 'INT', lang_orig: 'en', title_no: 'Sölden-traseen inspisert og godkjent — snøforholdene er gode', title_orig: 'Sölden course inspected and approved – snow conditions excellent', url: '#', pub_date: minsAgo(210), athletes: null, category: null },
  { id: 12, source_name: 'SRF',        country: 'SUI', lang_orig: 'de', title_no: 'Ny drakt-teknologi kan gi opptil 0,4 sekunder i storslalåm — slik fungerer det', title_orig: 'Neue Anzugtechnologie soll bis zu 0,4 Sekunden im Riesenslalom bringen', url: '#', pub_date: minsAgo(248), athletes: null, category: null },
]

export async function fetchArticles({ country, athlete, limit = 80 } = {}) {
  try {
    const params = new URLSearchParams()
    if (country) params.set('country', country)
    if (athlete) params.set('athlete', athlete)
    params.set('limit', limit)
    const res = await fetch(`${BASE}/articles?${params}`)
    if (!res.ok) throw new Error('API ikke tilgjengelig')
    return res.json()
  } catch {
    let articles = MOCK_ARTICLES
    if (country) articles = articles.filter(a => a.country === country)
    return articles
  }
}

export async function triggerFetch() {
  try {
    await fetch(`${BASE}/fetch`, { method: 'POST' })
  } catch {}
}

export async function categorizeArticle(article_id, category) {
  try {
    await fetch(`${BASE}/categorize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ article_id, category }),
    })
  } catch {}
}

export async function uncategorizeArticle(article_id) {
  try {
    await fetch(`${BASE}/categorize/${article_id}`, { method: 'DELETE' })
  } catch {}
}
