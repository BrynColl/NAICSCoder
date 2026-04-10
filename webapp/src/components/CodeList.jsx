import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { LEVEL_NAMES } from '../data/loader.js'

export default function CodeList({ data }) {
  const { level } = useParams()
  const levelNum = parseInt(level)
  const [query, setQuery] = useState('')

  const records = data.byLevel.get(levelNum) ?? []

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return records
    return records.filter(
      (r) =>
        r.code.toLowerCase().includes(q) ||
        r.label.toLowerCase().includes(q)
    )
  }, [records, query])

  const levelName = LEVEL_NAMES[levelNum] ?? `Level ${levelNum}`

  return (
    <div>
      <div className="search-bar">
        <input
          type="search"
          placeholder={`Search ${levelName.toLowerCase()}…`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search"
        />
        <span className="search-count">
          {filtered.length} of {records.length}
        </span>
      </div>
      <ul className="code-list">
        {filtered.map((rec) => (
          <li key={rec.code}>
            <Link to={`/code/${encodeURIComponent(rec.code)}`} className="code-list-item">
              <span className="code-badge">{rec.code}</span>
              <span className="code-label">{rec.label}</span>
              {rec.revenue && (
                <span className="code-revenue">{rec.revenue}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
      {filtered.length === 0 && (
        <p className="not-found">No results for "{query}".</p>
      )}
    </div>
  )
}
