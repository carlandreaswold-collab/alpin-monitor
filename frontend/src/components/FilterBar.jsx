const COUNTRIES = [
  { code: '',    label: 'Alle' },
  { code: 'NOR', label: '🇳🇴 Norge' },
  { code: 'INT', label: '🌐 Internasjonalt' },
  { code: 'AUT', label: '🇦🇹 Østerrike' },
  { code: 'SUI', label: '🇨🇭 Sveits' },
  { code: 'FRA', label: '🇫🇷 Frankrike' },
  { code: 'ITA', label: '🇮🇹 Italia' },
]

export default function FilterBar({ country, onCountry, onFetch, fetching, total, search, onSearch }) {
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
        <span className="header-meta">{total} saker</span>
        <button className="fetch-btn" onClick={onFetch} disabled={fetching}>
          {fetching ? '⏳ Henter…' : '🔄 Hent nå'}
        </button>
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
      </div>
    </div>
  )
}
