import { useEffect, useState } from 'react'
import { fetchStats } from '../lib/api'
import { CATEGORIES } from './ArticleCard'

const SOURCE_FLAGS = { NOR: '🇳🇴', AUT: '🇦🇹', SWE: '🇸🇪', ITA: '🇮🇹', SUI: '🇨🇭', USA: '🌐', INT: '🌐' }

function pct(n, total) {
  if (!total) return 0
  return Math.round((n / total) * 100)
}

function Bar({ value, max, color, label, sublabel }) {
  const w = max ? Math.max(2, Math.round((value / max) * 100)) : 0
  return (
    <div className="stat-bar-row">
      <div className="stat-bar-label">{label}</div>
      <div className="stat-bar-track">
        <div className="stat-bar-fill" style={{ width: `${w}%`, background: color }} />
      </div>
      <div className="stat-bar-value">{value}</div>
      {sublabel && <div className="stat-bar-sub">{sublabel}</div>}
    </div>
  )
}

function StatTile({ label, value, sub, color }) {
  return (
    <div className="stat-tile" style={{ borderTopColor: color }}>
      <div className="stat-tile-value" style={{ color }}>{value}</div>
      <div className="stat-tile-label">{label}</div>
      {sub && <div className="stat-tile-sub">{sub}</div>}
    </div>
  )
}

function DayChart({ data }) {
  if (!data.length) return null
  const maxTotal = Math.max(...data.map(d => d.total))
  return (
    <div className="day-chart">
      {data.map(d => {
        const totalH = maxTotal ? Math.max(4, Math.round((d.total / maxTotal) * 120)) : 4
        const alpineH = d.total ? Math.round((d.alpine / d.total) * totalH) : 0
        const label = d.day.slice(5)
        return (
          <div key={d.day} className="day-col" title={`${d.day}: ${d.total} saker, ${d.alpine} alpine`}>
            <div className="day-bars">
              <div className="day-bar-total" style={{ height: totalH }} />
              <div className="day-bar-alpine" style={{ height: alpineH }} />
            </div>
            <div className="day-label">{label}</div>
          </div>
        )
      })}
    </div>
  )
}

export default function StatsPage() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetchStats().then(setStats)
  }, [])

  if (!stats) return <div className="fc-page"><div className="fc-empty">Laster statistikk…</div></div>

  const { bySource, byDay, byCategory, topAthletes, totals } = stats
  const alpineRate = pct(totals.alpine, totals.alpine + totals.rejected)
  const maxSourceTotal = Math.max(...bySource.map(s => s.total))

  return (
    <div className="stats-page">

      {/* Oversikt */}
      <section className="stats-section">
        <h2 className="stats-heading">Oversikt</h2>
        <div className="stat-tiles">
          <StatTile label="Saker totalt" value={totals.total} color="var(--fg2)" />
          <StatTile label="Godkjent alpint" value={totals.alpine} sub={`${alpineRate}% av sjekket`} color="var(--cat-goy)" />
          <StatTile label="Avvist" value={totals.rejected} color="var(--cat-viktig)" />
          <StatTile label="Ikke sjekket" value={totals.pending} color="#c8a030" />
        </div>
      </section>

      {/* Saker per dag */}
      <section className="stats-section">
        <h2 className="stats-heading">Saker siste 14 dager</h2>
        <div className="day-chart-wrap">
          <DayChart data={byDay} />
          <div className="day-legend">
            <span className="day-legend-item"><span className="day-legend-dot" style={{ background: 'var(--border2)' }} />Alle saker</span>
            <span className="day-legend-item"><span className="day-legend-dot" style={{ background: 'var(--cat-goy)' }} />Alpint</span>
          </div>
        </div>
      </section>

      {/* Per kilde */}
      <section className="stats-section">
        <h2 className="stats-heading">Alpint-rate per kilde</h2>
        <div className="source-table">
          {bySource.map(s => {
            const checked = s.alpine + s.rejected
            const rate = pct(s.alpine, checked)
            return (
              <div key={s.source_name} className="source-row">
                <div className="source-row-name">
                  <span>{SOURCE_FLAGS[s.country] || '🌐'}</span>
                  <span>{s.source_name}</span>
                </div>
                <div className="source-row-bars">
                  <div className="source-bar-track">
                    <div
                      className="source-bar-fill"
                      style={{ width: `${pct(s.total, maxSourceTotal)}%`, background: 'var(--border2)' }}
                    />
                    <div
                      className="source-bar-fill source-bar-alpine"
                      style={{ width: `${pct(s.alpine, maxSourceTotal)}%`, background: 'var(--cat-goy)' }}
                    />
                  </div>
                </div>
                <div className="source-row-stats">
                  <span className="source-stat-alpine">{s.alpine} alpint</span>
                  <span className="source-stat-total">av {s.total}</span>
                  <span className="source-stat-rate" style={{ color: rate > 50 ? 'var(--cat-goy)' : rate > 20 ? '#c8a030' : 'var(--cat-viktig)' }}>
                    {rate}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <div className="stats-two-col">
        {/* Kategorier */}
        {byCategory.length > 0 && (
          <section className="stats-section">
            <h2 className="stats-heading">Kategoriserte saker</h2>
            {byCategory.map(c => {
              const cat = CATEGORIES.find(k => k.id === c.category)
              const maxCat = Math.max(...byCategory.map(x => x.count))
              return (
                <Bar
                  key={c.category}
                  label={cat?.label || c.category}
                  value={c.count}
                  max={maxCat}
                  color={`var(--cat-${c.category})`}
                />
              )
            })}
          </section>
        )}

        {/* Topp utøvere */}
        {topAthletes.length > 0 && (
          <section className="stats-section">
            <h2 className="stats-heading">Mest omtalte utøvere</h2>
            {topAthletes.map(a => (
              <Bar
                key={a.name}
                label={a.name}
                value={a.count}
                max={topAthletes[0].count}
                color="var(--cat-sportslig)"
                sublabel={`${a.count} sak${a.count !== 1 ? 'er' : ''}`}
              />
            ))}
          </section>
        )}
      </div>

    </div>
  )
}
