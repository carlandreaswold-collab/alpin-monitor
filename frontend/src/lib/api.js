const BASE = '/api'

export async function fetchArticles({ country, athlete, limit = 80 } = {}) {
  const params = new URLSearchParams()
  if (country) params.set('country', country)
  if (athlete) params.set('athlete', athlete)
  params.set('limit', limit)
  const res = await fetch(`${BASE}/articles?${params}`)
  if (!res.ok) throw new Error('API ikke tilgjengelig')
  return res.json()
}

export async function fetchAthletes() {
  const res = await fetch(`${BASE}/athletes`)
  if (!res.ok) throw new Error()
  return res.json()
}

export async function triggerFetch() {
  await fetch(`${BASE}/fetch`, { method: 'POST' })
}

export async function categorizeArticle(article_id, category) {
  await fetch(`${BASE}/categorize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ article_id, category }),
  })
}

export async function uncategorizeArticle(article_id) {
  await fetch(`${BASE}/categorize/${article_id}`, { method: 'DELETE' })
}

export async function dismissArticle(article_id) {
  await fetch(`${BASE}/dismiss/${article_id}`, { method: 'POST' })
}

export async function approveArticle(article_id) {
  await fetch(`${BASE}/approve/${article_id}`, { method: 'POST' })
}

export async function fetchFactcheck() {
  const res = await fetch(`${BASE}/factcheck`)
  if (!res.ok) throw new Error()
  return res.json()
}
