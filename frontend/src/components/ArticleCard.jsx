import { useState } from 'react'
import { categorizeArticle, uncategorizeArticle, dismissArticle } from '../lib/api'
import { getRaceForDate } from '../lib/season'

function useNote(id) {
  const key = `note_${id}`
  const [note, setNote] = useState(() => {
    try { return localStorage.getItem(key) || '' } catch { return '' }
  })
  function save(val) {
    setNote(val)
    try { localStorage.setItem(key, val) } catch {}
  }
  return [note, save]
}

export const CATEGORIES = [
  { id: 'viktig',    label: '⚡ Viktig' },
  { id: 'sportslig', label: '🎿 Sportslig' },
  { id: 'nyheter',   label: '📰 Nyhet' },
  { id: 'goy',       label: '😄 Gøy' },
  { id: 'nerding',   label: '🔬 Nerding' },
  { id: 'kjendis',   label: '🌟 Kjendis' },
]

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

function factStatus(fact_ok) {
  if (fact_ok === 1)    return { cls: 'fact-ok',      label: '✓ Alpint' }
  if (fact_ok === 0)    return { cls: 'fact-no',      label: '✕ Avvist' }
  return                       { cls: 'fact-pending', label: '… Sjekkes' }
}

export default function ArticleCard({ article, onCategoryChange, onDismiss }) {
  const [loading, setLoading] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [note, saveNote] = useNote(article.id)
  const title = article.title_no || article.title_orig
  const currentCat = article.category
  const fact = factStatus(article.fact_ok)
  const race = getRaceForDate(article.pub_date || article.fetched_at)

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

  async function handleDismiss() {
    setDismissed(true)
    await dismissArticle(article.id)
    onDismiss?.(article.id)
  }

  if (dismissed) return null

  return (
    <div className="article-card">
      <div className="card-meta">
        <span className={`fact-badge ${fact.cls}`}>{fact.label}</span>
        <span className={`source-badge src-${article.country}`}>{article.source_name}</span>
        {article.lang_orig && article.lang_orig !== 'no' && (
          <span className="lang-tag">{article.lang_orig.toUpperCase()} → NO</span>
        )}
        {article.athletes && (
          <span className="athlete-tag">👤 {article.athletes.split(',')[0]}</span>
        )}
        {race && (
          <span className="race-badge" title={`${race.venue}: ${race.disciplines.join(', ')}`}>
            🏁 {race.venue}
          </span>
        )}
        <span className="card-time">{formatDate(article.pub_date || article.fetched_at)}</span>
        <button className="dismiss-btn" onClick={handleDismiss} title="Ikke alpint — skjul saken">✕ Ikke alpint</button>
      </div>

      <a href={article.url} target="_blank" rel="noopener noreferrer" className="card-title">
        {title}
      </a>

      {article.summary_no && (
        <p className="card-summary">{article.summary_no}</p>
      )}

      {article.spik_no && (
        <div className="card-spik">
          <span className="card-spik-label">📻 SPIK</span>
          <span className="card-spik-text">{article.spik_no}</span>
        </div>
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
        <button
          className="note-toggle"
          onClick={() => setNoteOpen(o => !o)}
          title="Notat"
        >
          {note ? '📝' : '✏️'} {noteOpen ? 'Lukk' : 'Notat'}
        </button>
      </div>

      {noteOpen && (
        <textarea
          className="card-note"
          value={note}
          onChange={e => saveNote(e.target.value)}
          placeholder="Skriv notat her — lagres automatisk…"
          rows={2}
        />
      )}
    </div>
  )
}
