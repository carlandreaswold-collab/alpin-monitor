const COUNTRIES = [
  { code: '',    label: 'Alle' },
  { code: 'NOR', label: '🇳🇴 Norge' },
  { code: 'INT', label: '🌐 Internasjonalt' },
  { code: 'AUT', label: '🇦🇹 Østerrike' },
  { code: 'SUI', label: '🇨🇭 Sveits' },
  { code: 'FRA', label: '🇫🇷 Frankrike' },
  { code: 'ITA', label: '🇮🇹 Italia' },
]

export default function FilterBar({ country, onCountry, onFetch, fetching, lastFetch, total, search, onSearch }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          type="search"
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Søk i titler, utøvere…"
          className="flex-1 text-sm px-3 py-1.5 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-blue-400"
        />
        <div className="flex items-center gap-2 text-xs text-gray-400 whitespace-nowrap">
          {total} saker
          {lastFetch && <span>· {lastFetch}</span>}
        </div>
        <button
          onClick={onFetch}
          disabled={fetching}
          className="text-sm px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {fetching ? '⏳' : '🔄 Hent nå'}
        </button>
      </div>
      <div className="flex gap-1 flex-wrap">
        {COUNTRIES.map(c => (
          <button
            key={c.code}
            onClick={() => onCountry(c.code)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              country === c.code
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  )
}
