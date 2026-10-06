const BASE = '/api'

const MOCK_ARTICLES = [
  { id: 1, source_name: 'FIS', country: 'INT', lang_orig: 'en', title_no: 'Odermatt åpner sesongen med seier i Sölden', title_orig: 'Odermatt wins season opener in Sölden', url: '#', pub_date: new Date().toISOString(), athletes: 'Marco Odermatt', nations: 'SUI', category: null },
  { id: 2, source_name: 'VG', country: 'NOR', lang_orig: 'no', title_no: 'Braathen i toppform foran Sölden: – Jeg har aldri kjent meg bedre', url: '#', pub_date: new Date().toISOString(), athletes: 'Lucas Braathen', nations: 'NOR', category: null },
  { id: 3, source_name: 'ÖSV', country: 'AUT', lang_orig: 'de', title_no: 'Vincent Kriechmayr klar for sesongstart', title_orig: 'Vincent Kriechmayr bereit für Saisonstart', url: '#', pub_date: new Date().toISOString(), athletes: 'Vincent Kriechmayr', nations: 'AUT', category: null },
  { id: 4, source_name: 'Eurosport', country: 'INT', lang_orig: 'en', title_no: 'Shiffrin sikter mot rekordseier nummer 100', title_orig: 'Shiffrin targets historic 100th win', url: '#', pub_date: new Date().toISOString(), athletes: 'Mikaela Shiffrin', nations: 'USA', category: null },
  { id: 5, source_name: 'SRF', country: 'SUI', lang_orig: 'de', title_no: 'Lara Gut-Behrami tilbake etter skade — klar for Sölden', title_orig: 'Lara Gut-Behrami nach Verletzungspause fit', url: '#', pub_date: new Date().toISOString(), athletes: 'Lara Gut-Behrami', nations: 'SUI', category: null },
  { id: 6, source_name: 'ski.no', country: 'NOR', lang_orig: 'no', title_no: 'Kilde tilbake på slalåmski for første gang siden skaden', url: '#', pub_date: new Date().toISOString(), athletes: 'Aleksander Aamodt Kilde', nations: 'NOR', category: null },
  { id: 7, source_name: "L'Équipe", country: 'FRA', lang_orig: 'fr', title_no: 'Clément Noël: «Årets mål er å vinne slalåmcupen»', title_orig: 'Clément Noël: «Mon objectif: le globe de slalom»', url: '#', pub_date: new Date().toISOString(), athletes: 'Clément Noël', nations: 'FRA', category: null },
  { id: 8, source_name: 'FIS', country: 'INT', lang_orig: 'en', title_no: 'Verdenscupkalenderen 2026/27 bekreftet — åpner i Sölden 23. oktober', title_orig: 'FIS confirms 2026/27 Alpine World Cup calendar', url: '#', pub_date: new Date().toISOString(), athletes: null, nations: null, category: null },
  { id: 9, source_name: 'ÖSV', country: 'AUT', lang_orig: 'de', title_no: 'Stefan Schwarz skadet i trening — sesongstart usikker', title_orig: 'Schwarz verletzt sich im Training', url: '#', pub_date: new Date().toISOString(), athletes: 'Stefan Schwarz', nations: 'AUT', category: null },
  { id: 10, source_name: 'Eurosport', country: 'INT', lang_orig: 'en', title_no: 'Henrik Kristoffersen: «Jeg vil vinne sammenlagtcupen»', title_orig: 'Henrik Kristoffersen: "I want to win the overall"', url: '#', pub_date: new Date().toISOString(), athletes: 'Henrik Kristoffersen', nations: 'NOR', category: null },
  { id: 11, source_name: 'Krone', country: 'AUT', lang_orig: 'de', title_no: 'Marcel Hirscher vurderer comeback: «Savner spenningen»', title_orig: 'Marcel Hirscher denkt über Comeback nach', url: '#', pub_date: new Date().toISOString(), athletes: 'Marcel Hirscher', nations: 'AUT', category: null },
  { id: 12, source_name: 'SRF', country: 'SUI', lang_orig: 'de', title_no: 'Ny aerodynamisk drakt kan gi sekunder i utfor — teknisk analyse', title_orig: 'Neuer aerodynamischer Anzug soll Sekunden bringen', url: '#', pub_date: new Date().toISOString(), athletes: null, nations: 'SUI', category: null },
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
