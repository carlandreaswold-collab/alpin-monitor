import { useEffect, useState, useCallback } from 'react'
import { fetchArticles, fetchAthletes, triggerFetch } from './lib/api'
import { socket } from './lib/socket'
import ArticleCard from './components/ArticleCard'
import FilterBar from './components/FilterBar'
import Sidebar from './components/Sidebar'
import CategoryModal from './components/CategoryModal'
import FactcheckPage from './components/FactcheckPage'
import StatsPage from './components/StatsPage'

export default function App() {
  const [articles, setArticles] = useState([])
  const [country, setCountry] = useState('')
  const [athlete, setAthlete] = useState('')
  const [athletes, setAthletes] = useState([])
  const [search, setSearch] = useState('')
  const [fetching, setFetching] = useState(false)
  const [newCount, setNewCount] = useState(0)
  const [categoryModal, setCategoryModal] = useState(null)
  const [view, setView] = useState('feed')

  const load = useCallback(async (c, a) => {
    const data = await fetchArticles({ country: c || undefined, athlete: a || undefined })
    setArticles(data)
  }, [])

  useEffect(() => { load(country, athlete) }, [country, athlete, load])

  useEffect(() => {
    fetchAthletes().then(setAthletes)
  }, [])

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
    socket.on('dismissed', ({ article_id }) => {
      setArticles(prev => prev.filter(a => a.id !== article_id))
    })
    socket.on('approved', ({ article_id }) => {
      load(country, athlete)
    })
    return () => socket.removeAllListeners()
  }, [country, load])

  async function handleFetch() {
    setFetching(true)
    setNewCount(0)
    await triggerFetch()
    setTimeout(() => { setFetching(false); fetchAthletes().then(setAthletes) }, 5000)
  }

  function handleCategoryChange(id, category) {
    setArticles(prev => prev.map(a => a.id === id ? { ...a, category } : a))
  }

  function handleDismiss(id) {
    setArticles(prev => prev.filter(a => a.id !== id))
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

  const categoryCounts = {}
  for (const a of filtered) {
    if (a.category) categoryCounts[a.category] = (categoryCounts[a.category] || 0) + 1
  }

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
            onCountry={c => { setCountry(c); setAthlete(''); setNewCount(0) }}
            athlete={athlete}
            onAthlete={a => { setAthlete(a); setCountry(''); setNewCount(0) }}
            athletes={athletes}
            onFetch={handleFetch}
            fetching={fetching}
            total={articles.length}
            search={search}
            onSearch={setSearch}
            categoryCounts={categoryCounts}
            onCategoryOpen={setCategoryModal}
          />
          <button
            className={`view-toggle-btn ${view === 'factcheck' ? 'active' : ''}`}
            onClick={() => setView(v => v === 'factcheck' ? 'feed' : 'factcheck')}
          >
            🔍 Faktasjekk
          </button>
          <button
            className={`view-toggle-btn ${view === 'stats' ? 'active' : ''}`}
            onClick={() => setView(v => v === 'stats' ? 'feed' : 'stats')}
            style={{ '--active-color': 'var(--cat-nerding)' }}
          >
            📊 Statistikk
          </button>
        </div>
      </header>

      {view === 'factcheck' && <FactcheckPage />}
      {view === 'stats' && <StatsPage />}

      <div className="main-layout" style={view !== 'feed' ? { display: 'none' } : {}}>
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
              <ArticleCard key={a.id} article={a} onCategoryChange={handleCategoryChange} onDismiss={handleDismiss} />
            ))
          )}
        </div>

        <Sidebar articles={filtered} onCategoryChange={handleCategoryChange} />
      </div>

      {categoryModal && (
        <CategoryModal
          category={categoryModal}
          articles={filtered}
          onClose={() => setCategoryModal(null)}
          onCategoryChange={handleCategoryChange}
          onDismiss={handleDismiss}
        />
      )}
    </>
  )
}
