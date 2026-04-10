import { useNavigate, useLocation } from 'react-router-dom'
import { LEVELS, LEVEL_NAMES } from '../data/loader.js'

export default function SliceNav() {
  const navigate = useNavigate()
  const location = useLocation()

  // Determine active level from pathname inside HashRouter (e.g. "/level/2")
  const match = location.pathname.match(/^\/level\/(\d)/)
  const activeLevel = match ? parseInt(match[1]) : null

  return (
    <nav className="slice-nav" aria-label="NAICS levels">
      {LEVELS.map((level) => (
        <button
          key={level}
          className={activeLevel === level ? 'active' : ''}
          onClick={() => navigate(`/level/${level}`)}
        >
          {LEVEL_NAMES[level]}
        </button>
      ))}
    </nav>
  )
}
