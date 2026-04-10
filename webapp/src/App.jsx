import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { loadData } from './data/loader.js'
import SliceNav from './components/SliceNav.jsx'
import CodeList from './components/CodeList.jsx'
import CodeCard from './components/CodeCard.jsx'

export default function App() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
      .then(setData)
      .catch((err) => setError(err.message))
  }, [])

  if (error) {
    return (
      <div className="app-shell">
        <AppHeader />
        <div className="main-content">
          <div className="error-screen">
            <strong>Failed to load data:</strong> {error}
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="app-shell">
        <AppHeader />
        <div className="main-content">
          <div className="loading-screen">Loading NAICS data…</div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <AppHeader />
      <div className="main-content">
        <SliceNav />
        <Routes>
          <Route path="/" element={<Navigate to="/level/2" replace />} />
          <Route
            path="/level/:level"
            element={<CodeList data={data} />}
          />
          <Route
            path="/code/:code"
            element={<CodeCard data={data} />}
          />
          <Route path="*" element={<Navigate to="/level/2" replace />} />
        </Routes>
      </div>
    </div>
  )
}

function AppHeader() {
  return (
    <header className="app-header">
      <h1>NAICS Coder — 2022 Economic Census</h1>
    </header>
  )
}
