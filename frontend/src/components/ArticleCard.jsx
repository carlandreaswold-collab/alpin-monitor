import { useState } from 'react'
import { categorizeArticle, uncategorizeArticle } from '../lib/api'

export const CATEGORIES = [
  { id: 'viktig',    label: '⚡ Viktig' },
  { id: 'sportslig', label: '🎿 Sportslig' },
  { id: 'nyheter',   label: '📰 Nyhet' },
  { id: 'goy',       label: '😄 Gøy' },
  { id: 'nerding',   label: '🔬 Nerding' },
  { id: 'kjendis',   label: '🌟 Kjendis' },
]

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60) return 'akkurat nå'
  if (diff < 3600) return `${Math.floor(diff / 60)} min`
  if (diff < 86400) return `${Math.floor(diff / 3600)} t`
  return `${Math.floor(diff / 86400)} d`
}

export default function ArticleCard({ article, onCategoryChange }) {
  const [loading, setLoading] = useState(false)
  const title = article.title_no || article.title_orig
  const currentCat = article.category

  async function handleCategory(catId) {
    setLoading(true)
    if (currentCat === catId) {
      await uncategorizeArticle(article.id)
      onCategoryChange(article.id, null)
    } else {
      await categorizeArticle(article.id, catId)
      onCategoryChange(article.id, catId)
    }
    setLoading(false)
  }

  return (
    <div className="article-card">
      <div className="card-meta">
        <span className={`source-badge src-${article.country}`}>{article.source_name}</span>
        {article.lang_orig && article.lang_orig !== 'no' && (
          <span className="lang-tag">{article.lang_orig.toUpperCase()} → NO</span>
        )}
        {article.athletes && (
          <span className="athlete-tag">👤 {article.athletes.split(',')[0]}</span>
        )}
        <span className="card-time">{timeAgo(article.pub_date || article.fetched_at)}</span>
      </div>

      <a href={article.url} target="_blank" rel="noopener noreferrer" className="card-title">
        {title}
      </a>

      {article.summary_no && (
        <p className="card-summary">{article.summary_no}</p>
      )}

      <div className="cat-row">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            disabled={loading}
            onClick={() => handleCategory(cat.id)}
            className={`cat-btn cat-btn-${cat.id} ${currentCat === cat.id ? `active-${cat.id}` : ''}`}
          >
            {cat.label}
          </button>
        ))}
        {currentCat && (
          <span className={`cat-strip strip-${currentCat}`}>
            {CATEGORIES.find(c => c.id === currentCat)?.label}
          </span>
        )}
      </div>
    </div>
  )
}
