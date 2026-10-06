import { useEffect, useState, useCallback } from 'react'
import { fetchArticles, triggerFetch } from './lib/api'
import { socket } from './lib/socket'
import ArticleCard from './components/ArticleCard'
import FilterBar from './components/FilterBar'

export default function App() {
  const [articles, setArticles] = useState([])
  const [country, setCountry] = useState('')
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
      setLastFetch(new Date(timestamp).toLocaleTimeString('no'))
      setNewCount(n => n + total)
      load(country)
    })
    socket.on('new_articles', () => load(country))
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
    await triggerFetch()
    setTimeout(() => setFetching(false), 3000)
  }

  function handleCategoryChange(id, category) {
    setArticles(prev => prev.map(a => a.id === id ? { ...a, category } : a))
  }

  const categorized = articles.filter(a => a.category)
  const uncategorized = articles.filter(a => !a.category)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⛷</span>
              <div>
                <h1 className="text-lg font-bold text-gray-900 leading-tight">Alpin Monitor</h1>
                <p className="text-xs text-gray-500">NRK-redaksjonen · alpindekning</p>
              </div>
            </div>
            {newCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
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
          />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {categorized.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Kategorisert ({categorized.length})
            </h2>
            <div className="grid gap-3">
              {categorized.map(a => (
                <ArticleCard key={a.id} article={a} onCategoryChange={handleCategoryChange} />
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Innkommende saker ({uncategorized.length})
          </h2>
          {uncategorized.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">🎿</p>
              <p>Ingen saker ennå — trykk «Hent nå»</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {uncategorized.map(a => (
                <ArticleCard key={a.id} article={a} onCategoryChange={handleCategoryChange} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
