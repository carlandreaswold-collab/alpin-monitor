import { CATEGORIES } from './ArticleCard'

const CAT_DOT = {
  viktig:    'bg-red-500',
  sportslig: 'bg-blue-500',
  nyheter:   'bg-gray-400',
  goy:       'bg-green-500',
  nerding:   'bg-purple-500',
  kjendis:   'bg-orange-400',
}

export default function Sidebar({ articles, onCategoryChange }) {
  const categorized = articles.filter(a => a.category)

  return (
    <aside className="sticky top-[120px]">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Spik-liste</h2>
          {categorized.length > 0 && (
            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {categorized.length}
            </span>
          )}
        </div>

        {categorized.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-400 text-xs">
            <p className="text-2xl mb-2">📋</p>
            Ingen saker kategorisert ennå.<br />
            Klikk «+ Kategori» på en sak.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {categorized.map(a => {
              const cat = CATEGORIES.find(c => c.id === a.category)
              const title = a.title_no || a.title_orig
              return (
                <div key={a.id} className="px-4 py-3 hover:bg-gray-50 group">
                  <div className="flex items-start gap-2">
                    <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${CAT_DOT[a.category] || 'bg-gray-300'}`} />
                    <div className="min-w-0 flex-1">
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-gray-800 hover:text-blue-700 leading-snug block line-clamp-2"
                      >
                        {title}
                      </a>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-400">{a.source_name}</span>
                        {cat && <span className="text-[10px] text-gray-500">{cat.label}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => { onCategoryChange(a.id, null); fetch(`/api/categorize/${a.id}`, { method: 'DELETE' }) }}
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-gray-500 text-xs transition-opacity flex-shrink-0"
                      title="Fjern"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </aside>
  )
}
