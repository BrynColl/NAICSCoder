/**
 * loader.js — load and index NAICS + NAPCS JSON data.
 *
 * Returns a promise resolving to { byCode, byParent, byLevel, napcs }.
 *
 * byCode   : Map<string, record>          — code → NAICS record
 * byParent : Map<string, record[]>        — parentCode → child records
 * byLevel  : Map<number, record[]>        — level (2-6) → records at that level
 * napcs    : Map<string, napcsEntry>      — NAICS code → NAPCS products entry
 */

let _cache = null

export async function loadData() {
  if (_cache) return _cache

  const [naicsData, napcsData] = await Promise.all([
    fetch('./data/naics.json').then((r) => r.json()),
    fetch('./data/napcs.json').then((r) => r.json()),
  ])

  const byCode = new Map()
  const byParent = new Map()
  const byLevel = new Map()

  for (const rec of naicsData) {
    byCode.set(rec.code, rec)

    if (!byLevel.has(rec.level)) byLevel.set(rec.level, [])
    byLevel.get(rec.level).push(rec)

    const parent = rec.parentCode || ''
    if (!byParent.has(parent)) byParent.set(parent, [])
    byParent.get(parent).push(rec)
  }

  const napcs = new Map(Object.entries(napcsData))

  _cache = { byCode, byParent, byLevel, napcs }
  return _cache
}

export const LEVEL_NAMES = {
  2: 'Sectors',
  3: 'Subsectors',
  4: 'Industry Groups',
  5: 'Industries',
  6: 'National Industries',
}

export const LEVELS = [2, 3, 4, 5, 6]

/** Format revenue in $1K units to a human-readable string. */
export function formatRevThousands(val) {
  if (val == null) return null
  if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(1)}T`
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}B`
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}M`
  return `$${val.toLocaleString()}K`
}

/** Return true if a napcsJoinFlag value indicates no NAPCS data is available. */
export function isNoNapcsFlag(flag) {
  return typeof flag === 'string' && flag.startsWith('No -')
}
