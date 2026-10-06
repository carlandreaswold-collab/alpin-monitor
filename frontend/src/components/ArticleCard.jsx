import { useState } from 'react'
import { categorizeArticle, uncategorizeArticle } from '../lib/api'

export const CATEGORIES = [
  { id: 'viktig',    label: '⚡ Viktig',    color: 'red' },
  { id: 'sportslig', label: '🎿 Sportslig', color: 'blue' },
  { id: 'nyheter',   label: '📰 Nyhet',     color: 'gray' },
  { id: 'goy',       label: '😄 Gøy',       color: 'green' },
  { id: 'nerding',   label: '🔬 Nerding',   color: 'purple' },
  { id: 'kjendis',   label: '🌟 Kjendis',   color: 'orange' },
]

const CAT_STYLE = {
  red:    'bg-red-50 text-red-700 border-red-200',
  blue:   'bg-blue-50 text-blue-700 border-blue-200',
  gray:   'bg-gray-50 text-gray-600 border-gray-200',
  green:  'bg-green-50 text-green-700 border-green-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
}

const COUNTRY_FLAG = {
  NOR: '🇳🇴', AUT: '🇦🇹', SUI: '🇨🇭', FRA: '🇫🇷',
  ITA: '🇮🇹', GER: '🇩🇪', SLO: '🇸🇮', SWE: '🇸🇪', INT: '🌐',
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60) return 'akkurat nå'
  if (diff < 3600) return `${Math.floor(diff / 60)} min`
  if (diff < 86400) return `${Math.floor(diff / 3600)} t`
  return `${Math.floor(diff / 86400)} d`
}

export default function ArticleCard({ article, onCategoryChange }) {
  const [showCats, setShowCats] = useState(false)
  const [loading, setLoading] = useState(false)

  const title = article.title_no || article.title_orig
  const flag = COUNTRY_FLAG[article.country] || '🌐'
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

  const borderStyle = article.category === 'viktig'
    ? 'border-l-4 border-l-red-500'
    : article.category
    ? 'border-l-4 border-l-blue-400'
    : ''

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow ${borderStyle}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1 flex-wrap">
            <span>{flag} {article.source_name}</span>
            <span>·</span>
            <span>{timeAgo(article.pub_date || article.fetched_at)}</span>
            {article.lang_orig && article.lang_orig !== 'no' && (
              <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[10px]">
                {article.lang_orig.toUpperCase()} → NO
              </span>
            )}
            {article.athletes && (
              <span className="text-blue-500 truncate max-w-[140px]">
                👤 {article.athletes.split(',')[0]}
              </span>
            )}
          </div>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-gray-900 hover:text-blue-700 leading-snug block text-sm"
          >
            {title}
          </a>
          {article.summary_no && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{article.summary_no}</p>
          )}
        </div>

        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowCats(v => !v)}
            disabled={loading}
            className={`text-xs px-2 py-1 rounded-full border transition-colors ${
              currentCat
                ? CAT_STYLE[currentCat.color]
                : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'
            }`}
          >
            {loading ? '…' : currentCat ? currentCat.label : '+ Kategori'}
          </button>

          {showCats && (
            <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-lg shadow-lg p-1.5 flex flex-col gap-0.5 min-w-36">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleCategory(cat.id)}
                  className={`text-left text-xs px-3 py-1.5 rounded hover:bg-gray-50 transition-colors ${
                    article.category === cat.id ? 'font-semibold ' + CAT_STYLE[cat.color] : 'text-gray-700'
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
