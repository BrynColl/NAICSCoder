import { Link } from 'react-router-dom'
import { LEVEL_NAMES } from '../data/loader.js'

export default function ChildrenTable({ children, childLevel }) {
  if (!children || children.length === 0) return null

  const levelName = LEVEL_NAMES[childLevel] ?? 'Children'

  return (
    <div>
      <h2 className="section-header">
        {levelName} ({children.length})
      </h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Label</th>
            <th className="revenue-cell">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {children.map((child) => (
            <tr key={child.code}>
              <td className="mono">
                <Link to={`/code/${encodeURIComponent(child.code)}`}>
                  {child.code}
                </Link>
              </td>
              <td>
                <Link to={`/code/${encodeURIComponent(child.code)}`}>
                  {child.label}
                </Link>
              </td>
              <td className="revenue-cell">{child.revenue || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
