import { CATEGORIES } from './ArticleCard'
import { uncategorizeArticle } from '../lib/api'

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60) return 'nå'
  if (diff < 3600) return `${Math.floor(diff / 60)} min`
  if (diff < 86400) return `${Math.floor(diff / 3600)} t`
  return `${Math.floor(diff / 86400)} d`
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d)) return ''
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}.${mm} kl. ${hh}:${min}`
}

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
                <div className="spik-source">
                  {a.source_name} · {CATEGORIES.find(c => c.id === a.category)?.label}
                  {(a.pub_date || a.fetched_at) && <span className="spik-time"> · {formatDate(a.pub_date || a.fetched_at)}</span>}
                  {a.cat_created_at && <span className="spik-time"> · kategorisert {timeAgo(a.cat_created_at)} siden</span>}
                </div>
                {a.spik_no && (
                  <p className="spik-text">{a.spik_no}</p>
                )}
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
