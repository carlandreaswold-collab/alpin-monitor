import { useState } from 'react'
import { categorizeArticle, uncategorizeArticle } from '../lib/api'

const CATEGORIES = [
  { id: 'viktig',    label: '🔴 Viktig' },
  { id: 'sportslig', label: '🎿 Sportslig' },
  { id: 'nyheter',   label: '📰 Nyhet' },
  { id: 'goy',       label: '😄 Gøy' },
  { id: 'nerding',   label: '🔢 Nerding' },
  { id: 'kjendis',   label: '⭐ Kjendis' },
]

const FLAG = {
  NO: '🇳🇴', AT: '🇦🇹', DE: '🇩🇪', CH: '🇨🇭', FR: '🇫🇷',
  IT: '🇮🇹', SL: '🇸🇮', SE: '🇸🇪', FI: '🇫🇮', INT: '🌐',
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60) return 'akkurat nå'
  if (diff < 3600) return `${Math.floor(diff / 60)} min siden`
  if (diff < 86400) return `${Math.floor(diff / 3600)} t siden`
  return `${Math.floor(diff / 86400)} d siden`
}

export default function ArticleCard({ article, onCategoryChange }) {
  const [showCats, setShowCats] = useState(false)
  const [loading, setLoading] = useState(false)

  const title = article.title_no || article.title_orig
  const flag = FLAG[article.country] || '🌐'
  const currentCat = CATEGORIES.find(c => c.id === article.category)

  async function handleCategory(catId) {
    setLoading(true)
    if (article.category === catId) {
      await uncategorizeArticle(article.id)
      onCategoryChange(article.id, null)
    } else {
      await categorizeArticle(article.id, catId)
      onCategoryChange(article.id, catId)
    }
    setLoading(false)
    setShowCats(false)
  }

  return (
    <div className={`bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${article.category === 'viktig' ? 'border-l-4 border-l-red-500' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <span>{flag} {article.source_name}</span>
            <span>·</span>
            <span>{timeAgo(article.pub_date || article.fetched_at)}</span>
            {article.athletes && (
              <>
                <span>·</span>
                <span className="text-blue-600">👤 {article.athletes.split(',')[0]}</span>
              </>
            )}
          </div>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-gray-900 hover:text-blue-700 leading-snug block"
          >
            {title}
          </a>
          {article.summary_no && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{article.summary_no}</p>
          )}
        </div>

        <div className="flex-shrink-0 relative">
          <button
            onClick={() => setShowCats(v => !v)}
            disabled={loading}
            className={`text-xs px-2 py-1 rounded-full border transition-colors ${
              currentCat
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
            }`}
          >
            {currentCat ? currentCat.label : '+ Kategori'}
          </button>

          {showCats && (
            <div className="absolute right-0 top-8 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex flex-col gap-1 min-w-36">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleCategory(cat.id)}
                  className={`text-left text-sm px-3 py-1.5 rounded hover:bg-gray-100 transition-colors ${
                    article.category === cat.id ? 'bg-blue-50 font-medium text-blue-700' : 'text-gray-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
