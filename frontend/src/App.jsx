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
  const [lastFetch, setLastFetch] = useState(null)
  const [newCount, setNewCount] = useState(0)

  const load = useCallback(async (c) => {
    const data = await fetchArticles({ country: c || undefined })
    setArticles(data)
  }, [])

  useEffect(() => { load(country) }, [country, load])

  useEffect(() => {
    socket.on('fetch_done', ({ total, timestamp }) => {
      setLastFetch(new Date(timestamp).toLocaleTimeString('no', { hour: '2-digit', minute: '2-digit' }))
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xl">⛷</span>
            <h1 className="text-base font-bold text-gray-900">Alpin Monitor</h1>
            <span className="text-xs text-gray-400">NRK-redaksjonen</span>
            {newCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                +{newCount} nye
              </span>
            )}
          </div>
          <FilterBar
            country={country}
            onCountry={c => { setCountry(c); setNewCount(0) }}
            onFetch={handleFetch}
            fetching={fetching}
            lastFetch={lastFetch}
            total={articles.length}
            search={search}
            onSearch={setSearch}
          />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 items-start">

          <section>
            <div className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wider">
              Innkommende — {uncategorized.length} saker
            </div>
            {uncategorized.length === 0 ? (
              <div className="text-center py-16 text-gray-300">
                <p className="text-4xl mb-3">🎿</p>
                <p className="text-sm">
                  {search ? 'Ingen treff på søket' : 'Ingen saker ennå — trykk «Hent nå»'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {uncategorized.map(a => (
                  <ArticleCard key={a.id} article={a} onCategoryChange={handleCategoryChange} />
                ))}
              </div>
            )}
          </section>

          <Sidebar articles={filtered} onCategoryChange={handleCategoryChange} />
        </div>
      </main>
    </div>
  )
}
