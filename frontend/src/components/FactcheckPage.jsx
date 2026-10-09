import { useEffect, useState } from 'react'
import { fetchFactcheck, approveArticle, dismissArticle } from '../lib/api'

const TABS = [
  { id: 'pending', label: '🟡 Venter', filter: a => a.fact_ok === null },
  { id: 'ok',      label: '🟢 Godkjent', filter: a => a.fact_ok === 1 },
  { id: 'no',      label: '🔴 Avvist', filter: a => a.fact_ok === 0 },
]

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60) return 'nå'
  if (diff < 3600) return `${Math.floor(diff / 60)} min siden`
  if (diff < 86400) return `${Math.floor(diff / 3600)} t siden`
  return `${Math.floor(diff / 86400)} d siden`
}

export default function FactcheckPage() {
  const [articles, setArticles] = useState([])
  const [tab, setTab] = useState('pending')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFactcheck().then(data => { setArticles(data); setLoading(false) })
  }, [])

  async function handleApprove(id) {
    await approveArticle(id)
    setArticles(prev => prev.map(a => a.id === id ? { ...a, fact_ok: 1, fact_notes: null } : a))
  }

  async function handleDismiss(id) {
    await dismissArticle(id)
    setArticles(prev => prev.map(a => a.id === id ? { ...a, fact_ok: 0, fact_notes: 'Manuelt avvist' } : a))
  }

  const q = search.toLowerCase()
  const tabDef = TABS.find(t => t.id === tab)
  const visible = articles
    .filter(tabDef.filter)
    .filter(a => !q || (a.title_no || a.title_orig || '').toLowerCase().includes(q))

  const counts = {}
  for (const t of TABS) counts[t.id] = articles.filter(t.filter).length

  return (
    <div className="fc-page">
      <div className="fc-toolbar">
        <div className="fc-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`fc-tab ${tab === t.id ? 'fc-tab-active' : ''} fc-tab-${t.id}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              <span className="fc-badge">{counts[t.id] || 0}</span>
            </button>
          ))}
        </div>
        <input
          className="search-input fc-search"
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Søk i titler…"
        />
      </div>

      {loading ? (
        <div className="fc-empty">Laster…</div>
      ) : visible.length === 0 ? (
        <div className="fc-empty">Ingen saker her.</div>
      ) : (
        <div className="fc-list">
          {visible.map(a => {
            const title = a.title_no || a.title_orig
            return (
              <div key={a.id} className={`fc-row fc-row-${a.fact_ok === 1 ? 'ok' : a.fact_ok === 0 ? 'no' : 'pending'}`}>
                <div className="fc-row-main">
                  <a href={a.url} target="_blank" rel="noopener noreferrer" className="fc-title">
                    {title}
                  </a>
                  <div className="fc-meta">
                    <span className={`source-badge src-${a.country}`}>{a.source_name}</span>
                    <span className="fc-time">{timeAgo(a.pub_date || a.fetched_at)}</span>
                    {a.fact_notes && <span className="fc-notes">{a.fact_notes}</span>}
                  </div>
                </div>
                <div className="fc-actions">
                  {a.fact_ok !== 1 && (
                    <button className="fc-btn fc-approve" onClick={() => handleApprove(a.id)}>✓ Godkjenn</button>
                  )}
                  {a.fact_ok !== 0 && (
                    <button className="fc-btn fc-reject" onClick={() => handleDismiss(a.id)}>✕ Avvis</button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
