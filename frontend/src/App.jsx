import { useEffect, useState, useCallback } from 'react'
import { fetchArticles, triggerFetch } from './lib/api'
import { socket } from './lib/socket'
import ArticleCard from './components/ArticleCard'
import FilterBar from './components/FilterBar'
import Sidebar from './components/Sidebar'

export default function App() {
  const [articles, setArticles] = useState([])
  const [country, setCountry] = useState('')
  const [search, setSearch] = useState('')
  const [fetching, setFetching] = useState(false)
  const [newCount, setNewCount] = useState(0)

  const load = useCallback(async (c) => {
    const data = await fetchArticles({ country: c || undefined })
    setArticles(data)
  }, [])

  useEffect(() => { load(country) }, [country, load])

  useEffect(() => {
    socket.on('fetch_done', ({ total }) => {
      if (total > 0) setNewCount(n => n + total)
      load(country)
    })
    socket.on('categorized', ({ article_id, category }) => {
      setArticles(prev => prev.map(a => a.id === article_id ? { ...a, category } : a))
    })
    socket.on('uncategorized', ({ article_id }) => {
      setArticles(prev => prev.map(a => a.id === article_id ? { ...a, category: null } : a))
    })
    return () => socket.removeAllListeners()
  }, [country, load])

  async function handleFetch() {
    setFetching(true)
    setNewCount(0)
    await triggerFetch()
    setTimeout(() => setFetching(false), 5000)
  }

  function handleCategoryChange(id, category) {
    setArticles(prev => prev.map(a => a.id === id ? { ...a, category } : a))
  }

  const filtered = articles.filter(a => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (a.title_no || a.title_orig || '').toLowerCase().includes(q) ||
      (a.athletes || '').toLowerCase().includes(q) ||
      (a.source_name || '').toLowerCase().includes(q)
    )
  })

  const uncategorized = filtered.filter(a => !a.category)

  return (
    <>
      <header className="app-header">
        <div className="header-top">
          <div className="logo">⛷ Alpin<span className="logo-accent">Monitor</span></div>
          <div className="live-badge"><span className="live-dot" />LIVE</div>
          {newCount > 0 && (
            <span style={{ background: 'var(--cat-viktig)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 10 }}>
              +{newCount} nye
            </span>
          )}
          <FilterBar
            country={country}
            onCountry={c => { setCountry(c); setNewCount(0) }}
            onFetch={handleFetch}
            fetching={fetching}
            total={articles.length}
            search={search}
            onSearch={setSearch}
          />
        </div>
      </header>

      <div className="main-layout">
        <div className="feed-col">
          <div className="section-label">
            Innkommende — {uncategorized.length} saker
          </div>
          {uncategorized.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">⛷</div>
              {search ? 'Ingen treff på søket' : 'Ingen saker — trykk «Hent nå»'}
            </div>
          ) : (
            uncategorized.map(a => (
              <ArticleCard key={a.id} article={a} onCategoryChange={handleCategoryChange} />
            ))
          )}
        </div>

        <Sidebar articles={filtered} onCategoryChange={handleCategoryChange} />
      </div>
    </>
  )
}
