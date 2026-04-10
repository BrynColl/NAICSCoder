import { isNoNapcsFlag, formatRevThousands } from '../data/loader.js'

export default function NapcsTable({ napcsEntry }) {
  if (!napcsEntry) {
    return (
      <div>
        <h2 className="section-header">Top Products (NAPCS 2022)</h2>
        <p className="napcs-flag-note">No NAPCS product data available for this industry.</p>
      </div>
    )
  }

  const { napcsJoinFlag, products } = napcsEntry

  if (isNoNapcsFlag(napcsJoinFlag)) {
    return (
      <div>
        <h2 className="section-header">Top Products (NAPCS 2022)</h2>
        <p className="napcs-flag-note">{napcsJoinFlag}</p>
      </div>
    )
  }

  if (!products || products.length === 0) {
    return (
      <div>
        <h2 className="section-header">Top Products (NAPCS 2022)</h2>
        <p className="napcs-flag-note">No product data available.</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="section-header">
        Top Products (NAPCS 2022) — by revenue
      </h2>
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: '2.5rem' }}>#</th>
            <th>Product</th>
            <th className="revenue-cell">Revenue ($)</th>
            <th className="pct-cell">% of Total</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.rank}>
              <td className="mono" style={{ textAlign: 'center' }}>{p.rank}</td>
              <td>
                <div style={{ fontWeight: 500, fontSize: '0.88rem' }}>{p.label}</div>
                <div className="mono" style={{ fontSize: '0.78rem', color: '#888', marginTop: '0.1rem' }}>
                  {p.code}
                </div>
              </td>
              <td className="revenue-cell">
                {p.revThousands != null
                  ? formatRevThousands(p.revThousands)
                  : '—'}
              </td>
              <td className="pct-cell">
                {p.pct != null ? `${p.pct}%` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
