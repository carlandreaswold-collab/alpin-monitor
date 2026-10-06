import { CATEGORIES } from './ArticleCard'
import { uncategorizeArticle } from '../lib/api'

export default function Sidebar({ articles, onCategoryChange }) {
  const categorized = articles.filter(a => a.category)

  return (
    <div className="sidebar-col">
      <div className="sidebar-header">
        Spik-liste
        {categorized.length > 0 && <span className="spik-count">{categorized.length}</span>}
      </div>

      {categorized.length === 0 ? (
        <div className="spik-empty">
          Ingen saker kategorisert ennå.<br />
          Klikk en kategori på en sak.
        </div>
      ) : (
        categorized.map(a => {
          const title = a.title_no || a.title_orig
          return (
            <div key={a.id} className="spik-item">
              <span className={`spik-dot dot-${a.category}`} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <a href={a.url} target="_blank" rel="noopener noreferrer" className="spik-title">
                  {title}
                </a>
                <div className="spik-source">{a.source_name} · {CATEGORIES.find(c => c.id === a.category)?.label}</div>
              </div>
              <button
                onClick={() => { uncategorizeArticle(a.id); onCategoryChange(a.id, null) }}
                style={{ background: 'none', border: 'none', color: 'var(--fg3)', cursor: 'pointer', fontSize: 12, flexShrink: 0, padding: '0 2px' }}
                title="Fjern"
              >✕</button>
            </div>
          )
        })
      )}
    </div>
  )
}
