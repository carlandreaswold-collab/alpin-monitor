const BASE = '/api'

export async function fetchArticles({ country, athlete, limit = 80 } = {}) {
  const params = new URLSearchParams()
  if (country) params.set('country', country)
  if (athlete) params.set('athlete', athlete)
  params.set('limit', limit)
  const res = await fetch(`${BASE}/articles?${params}`)
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
