import { CATEGORIES } from './ArticleCard'
import { useReadonly } from '../lib/readonly'

const COUNTRIES = [
  { code: '',    label: 'Alle' },
  { code: 'NOR', label: '🇳🇴 Norge' },
  { code: 'INT', label: '🌐 Internasjonalt' },
  { code: 'AUT', label: '🇦🇹 Østerrike' },
  { code: 'SUI', label: '🇨🇭 Sveits' },
  { code: 'FRA', label: '🇫🇷 Frankrike' },
  { code: 'ITA', label: '🇮🇹 Italia' },
  { code: 'SWE', label: '🇸🇪 Sverige' },
  { code: 'GER', label: '🇩🇪 Tyskland' },
  { code: 'FRA', label: '🇫🇷 Frankrike' },
]

export default function FilterBar({ country, onCountry, athlete, onAthlete, athletes, onFetch, fetching, total, search, onSearch, categoryCounts = {}, onCategoryOpen }) {
  const totalCategorized = Object.values(categoryCounts).reduce((s, n) => s + n, 0)
  const readonly = useReadonly()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 8 }}>
        <input
          className="search-input header-search"
          type="search"
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Søk i titler, utøvere…"
        />
        {athletes.length > 0 && (
          <select
            className="athlete-select"
            value={athlete}
            onChange={e => onAthlete(e.target.value)}
          >
            <option value="">Alle utøvere</option>
            {athletes.map(a => (
              <option key={a.name} value={a.name}>
                {a.name} ({a.count})
              </option>
            ))}
          </select>
        )}
        <span className="header-meta">{total} saker</span>
        {!readonly && (
          <button className="fetch-btn" onClick={onFetch} disabled={fetching}>
            {fetching ? '⏳ Henter…' : '🔄 Hent nå'}
          </button>
        )}
      </div>
      <div className="filter-tabs">
        {COUNTRIES.map(c => (
          <button
            key={c.code}
            className={`filter-tab ${country === c.code ? 'active' : ''}`}
            onClick={() => onCountry(c.code)}
          >
            {c.label}
          </button>
        ))}
        {totalCategorized > 0 && (
          <>
            <span className="filter-tab-divider" />
            {CATEGORIES.map(cat => {
              const count = categoryCounts[cat.id] || 0
              if (!count) return null
              return (
                <button
                  key={cat.id}
                  className={`filter-tab cat-nav-tab cat-nav-${cat.id}`}
                  onClick={() => onCategoryOpen(cat.id)}
                >
                  {cat.label}
                  <span className={`cat-nav-badge badge-${cat.id}`}>{count}</span>
                </button>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
