const COUNTRIES = [
  { code: '', label: 'Alle land' },
  { code: 'NO', label: '🇳🇴 Norge' },
  { code: 'AT', label: '🇦🇹 Østerrike' },
  { code: 'DE', label: '🇩🇪 Tyskland' },
  { code: 'CH', label: '🇨🇭 Sveits' },
  { code: 'FR', label: '🇫🇷 Frankrike' },
  { code: 'IT', label: '🇮🇹 Italia' },
  { code: 'SL', label: '🇸🇮 Slovenia' },
  { code: 'SE', label: '🇸🇪 Sverige' },
  { code: 'INT', label: '🌐 Internasjonalt' },
]

export default function FilterBar({ country, onCountry, onFetch, fetching, lastFetch, total }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex gap-1 flex-wrap">
        {COUNTRIES.map(c => (
          <button
            key={c.code}
            onClick={() => onCountry(c.code)}
            className={`text-sm px-3 py-1 rounded-full border transition-colors ${
              country === c.code
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-3">
        {lastFetch && (
          <span className="text-xs text-gray-400">
            {total} saker · sist hentet {lastFetch}
          </span>
        )}
        <button
          onClick={onFetch}
          disabled={fetching}
          className="text-sm px-4 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {fetching ? '⏳ Henter...' : '🔄 Hent nå'}
        </button>
      </div>
    </div>
  )
}
