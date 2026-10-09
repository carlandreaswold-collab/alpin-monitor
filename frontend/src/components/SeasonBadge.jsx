import { useMemo } from 'react'
import { getSeasonStatus } from '../lib/season'

const PHASE_CLS = {
  race:      'season-race',
  season:    'season-active',
  preseason: 'season-pre',
  offseason: 'season-off',
}

export default function SeasonBadge() {
  const status = useMemo(() => getSeasonStatus(), [])

  return (
    <div className={`season-badge ${PHASE_CLS[status.phase]}`}>
      <span className="season-label">{status.label}</span>
      {status.detail && <span className="season-detail">{status.detail}</span>}
    </div>
  )
}
