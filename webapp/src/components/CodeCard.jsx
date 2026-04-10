import { useParams, useNavigate, Link } from 'react-router-dom'
import { LEVEL_NAMES } from '../data/loader.js'
import ChildrenTable from './ChildrenTable.jsx'
import NapcsTable from './NapcsTable.jsx'

export default function CodeCard({ data }) {
  const { code } = useParams()
  const navigate = useNavigate()

  const decodedCode = decodeURIComponent(code)
  const rec = data.byCode.get(decodedCode)

  if (!rec) {
    return <div className="not-found">Code "{decodedCode}" not found.</div>
  }

  const children = data.byParent.get(decodedCode) ?? []
  const napcsEntry = data.napcs.get(decodedCode) ?? null
  const parent = rec.parentCode ? data.byCode.get(rec.parentCode) : null

  return (
    <div>
      {/* Breadcrumb / back navigation */}
      <div className="card-nav">
        <button onClick={() => navigate(`/level/${rec.level}`)}>
          ← {LEVEL_NAMES[rec.level]}
        </button>
        {parent && (
          <>
            <span className="sep">·</span>
            <Link to={`/code/${encodeURIComponent(parent.code)}`}>
              {parent.code}: {parent.label}
            </Link>
          </>
        )}
      </div>

      <div className="code-card">
        {/* Code Label */}
        <div className="card-field">
          <div className="card-field-label">Code Label</div>
          <div className="card-field-value">
            <span className="label-display">{rec.label}</span>
          </div>
        </div>

        {/* Code */}
        <div className="card-field">
          <div className="card-field-label">Code</div>
          <div className="card-field-value">
            <span className="code-display">{rec.code}</span>
          </div>
        </div>

        {/* Revenue (if available) */}
        {rec.revenue && (
          <div className="card-field">
            <div className="card-field-label">Revenue (2022)</div>
            <div className="card-field-value">{rec.revenue}</div>
          </div>
        )}

        {/* Description */}
        <div className="card-field">
          <div className="card-field-label">Description</div>
          <div className="card-field-value description">
            {rec.description || '—'}
          </div>
        </div>

        {/* Cross-References */}
        <div className="card-field">
          <div className="card-field-label">Cross-References</div>
          <div className="card-field-value description">
            {rec.crossRefs || '—'}
          </div>
        </div>
      </div>

      {/* Children table (levels 2-5) */}
      {children.length > 0 && (
        <ChildrenTable children={children} childLevel={rec.level + 1} />
      )}

      {/* NAPCS products (level 6 only) */}
      {rec.level === 6 && (
        <NapcsTable napcsEntry={napcsEntry} />
      )}
    </div>
  )
}
