import { useEffect, useState } from 'react'
import { CATEGORIES } from './ArticleCard'
import ArticleCard from './ArticleCard'

export default function CategoryModal({ category, articles, onClose, onCategoryChange, onDismiss }) {
  const [search, setSearch] = useState('')
  const cat = CATEGORIES.find(c => c.id === category)
  const q = search.toLowerCase()
  const catArticles = articles
    .filter(a => a.category === category)
    .filter(a => !q || (a.title_no || a.title_orig || '').toLowerCase().includes(q) || (a.athletes || '').toLowerCase().includes(q))

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className={`modal-title modal-title-${category}`}>{cat?.label}</span>
          <span className="modal-count">{catArticles.length} saker</span>
          <input
            className="search-input modal-search"
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Søk…"
            autoFocus
          />
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {catArticles.length === 0 ? (
            <div className="spik-empty">Ingen saker i denne kategorien ennå.</div>
          ) : (
            catArticles.map(a => (
              <ArticleCard
                key={a.id}
                article={a}
                onCategoryChange={(id, cat) => {
                  onCategoryChange(id, cat)
                  if (!cat) onClose()
                }}
                onDismiss={id => { onDismiss(id); }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
