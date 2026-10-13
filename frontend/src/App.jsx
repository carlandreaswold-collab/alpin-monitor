import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { ReadonlyContext, isReadonlyUrl } from './lib/readonly'
import { fetchArticles, fetchAthletes, fetchNations, triggerFetch, fetchStatus } from './lib/api'
import { socket } from './lib/socket'
import ArticleCard from './components/ArticleCard'
import FilterBar from './components/FilterBar'
import Sidebar from './components/Sidebar'
import CategoryModal from './components/CategoryModal'
import FactcheckPage from './components/FactcheckPage'
import StatsPage from './components/StatsPage'
import SeasonBadge from './components/SeasonBadge'

export default function App() {
  const [articles, setArticles] = useState([])
  const [country, setCountry] = useState('')
  const [athlete, setAthlete] = useState('')
  const [athletes, setAthletes] = useState([])
  const [nations, setNations] = useState([])
  const [search, setSearch] = useState('')
  const [fetching, setFetching] = useState(false)
  const [fetchLabel, setFetchLabel] = useState('')
  const [fetchResult, setFetchResult] = useState(null) // { text, error }
  const [newCount, setNewCount] = useState(0)
  const [categoryModal, setCategoryModal] = useState(null)
  const [view, setView] = useState('feed')
  const [newIds, setNewIds] = useState(new Set())
  const articlesRef = useRef([])
  const readonly = useMemo(() => isReadonlyUrl(), [])

  useEffect(() => { articlesRef.current = articles }, [articles])

  const load = useCallback(async (c, a) => {
    const data = await fetchArticles({ country: c || undefined, athlete: a || undefined })
    setArticles(data)
  }, [])

  useEffect(() => { load(country, athlete) }, [country, athlete, load])

  useEffect(() => {
    fetchAthletes().then(setAthletes)
    fetchNations().then(setNations).catch(() => {})
  }, [])

  // Sikkerhetsnett: hvis fetch_done aldri når oss (WebSocket falt ut), spør backend om status
  useEffect(() => {
    if (!fetching) return
    const t = setInterval(async () => {
      try {
        const { running } = await fetchStatus()
        if (!running) {
          setFetching(false)
          load(country, athlete)
          fetchAthletes().then(setAthletes)
          fetchNations().then(setNations).catch(() => {})
        }
      } catch {}
    }, 5000)
    return () => clearInterval(t)
  }, [fetching, country, athlete, load])

  useEffect(() => {
    if (!fetchResult) return
    const t = setTimeout(() => setFetchResult(null), 10000)
    return () => clearTimeout(t)
  }, [fetchResult])

  useEffect(() => {
    socket.on('fetch_progress', ({ label }) => {
      setFetching(true)
      setFetchLabel(label)
    })
    socket.on('fetch_done', async ({ total, alpine = 0, error }) => {
      setFetching(false)
      setFetchLabel('')
      if (error) setFetchResult({ text: `Henting feilet: ${error}`, error: true })
      else if (total === 0) setFetchResult({ text: 'Ingen nye saker' })
      else if (alpine === 0) setFetchResult({ text: `${total} nye saker hentet, ingen alpint` })
      else setFetchResult({ text: `${total} nye saker hentet, ${alpine} alpint` })
      fetchAthletes().then(setAthletes)
      fetchNations().then(setNations).catch(() => {})
      if (total > 0) setNewCount(n => n + total)
      const prevIds = new Set(articlesRef.current.map(a => a.id))
      const data = await fetchArticles({ country: country || undefined, athlete: athlete || undefined })
      setNewIds(new Set(data.filter(a => !prevIds.has(a.id)).map(a => a.id)))
      setArticles(data)
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
    setFetchLabel('Starter henting…')
    setFetchResult(null)
    setNewCount(0)
    try {
      await triggerFetch()
    } catch (err) {
      setFetching(false)
      setFetchLabel('')
      setFetchResult({ text: err.message || 'Backend svarer ikke', error: true })
    }
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

  const categoryCounts = {}
  for (const a of filtered) {
    if (a.category) categoryCounts[a.category] = (categoryCounts[a.category] || 0) + 1
  }

  return (
    <ReadonlyContext.Provider value={readonly}>
      <header className="app-header">
        <div className="header-top">
          <div className="logo">⛷ Alpin<span className="logo-accent">Monitor</span></div>
          <div className="live-badge"><span className="live-dot" />LIVE</div>
          <SeasonBadge />
          {!readonly && newCount > 0 && (
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
            nations={nations}
            onFetch={handleFetch}
            fetching={fetching}
            fetchLabel={fetchLabel}
            fetchResult={fetchResult}
            total={articles.length}
            search={search}
            onSearch={setSearch}
            categoryCounts={categoryCounts}
            onCategoryOpen={setCategoryModal}
          />
          {!readonly && (
            <button
              className={`view-toggle-btn ${view === 'factcheck' ? 'active' : ''}`}
              onClick={() => setView(v => v === 'factcheck' ? 'feed' : 'factcheck')}
            >
              🔍 Faktasjekk
            </button>
          )}
          <button
            className={`view-toggle-btn ${view === 'stats' ? 'active' : ''}`}
            onClick={() => setView(v => v === 'stats' ? 'feed' : 'stats')}
          >
            📊 Statistikk
          </button>
        </div>
      </header>

      {view === 'factcheck' && !readonly && <FactcheckPage />}
      {view === 'stats' && <StatsPage />}

      <div className="main-layout" style={view !== 'feed' ? { display: 'none' } : {}}>
        <div className="feed-col">
          <div className="section-label">
            Alle saker — {filtered.length}
          </div>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">⛷</div>
              {search ? 'Ingen treff på søket' : 'Ingen saker — trykk «Hent nå»'}
            </div>
          ) : (
            filtered.map(a => (
              <ArticleCard key={a.id} article={a} onCategoryChange={handleCategoryChange} onDismiss={handleDismiss} isNew={newIds.has(a.id)} />
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
    </ReadonlyContext.Provider>
  )
}
