import { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080'

const DIFF_COLORS = ['', 'bg-green-100 text-green-700', 'bg-green-100 text-green-600', 'bg-yellow-100 text-yellow-700', 'bg-orange-100 text-orange-700', 'bg-red-100 text-red-700']
const DIFF_LABELS = ['', 'Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard']

function SortIcon({ col, sort }) {
  if (sort.col !== col) return <span className="ml-1 text-muted">↕</span>
  return <span className="ml-1 text-accent">{sort.dir === 'asc' ? '↑' : '↓'}</span>
}

export default function AdminCentre() {
  const [countries, setCountries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ col: 'name', dir: 'asc' })

  function toggleSort(col) {
    setSort(prev => prev.col === col
      ? { col, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      : { col, dir: 'asc' }
    )
  }

  useEffect(() => {
    fetch(`${API_BASE}/admin/countries-data`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(data => { setCountries(data); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  const filtered = countries
    .filter(c => c.nameCommon.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let av, bv
      if (sort.col === 'name')         { av = a.nameCommon || '';                    bv = b.nameCommon || '' }
      else if (sort.col === 'capital') { av = a.capital || '';                       bv = b.capital || '' }
      else if (sort.col === 'continent') { av = a.region || '';                      bv = b.region || '' }
      else if (sort.col === 'subregion') { av = a.subregion || '';                   bv = b.subregion || '' }
      else if (sort.col === 'currency') { av = a.currencyName || '';                 bv = b.currencyName || '' }
      else if (sort.col === 'currencyCode') { av = a.currencyCode || '';             bv = b.currencyCode || '' }
      else if (sort.col === 'language') { av = (a.languages || []).join(', ');       bv = (b.languages || []).join(', ') }
      else if (sort.col === 'difficulty') { return sort.dir === 'asc' ? (a.difficulty || 3) - (b.difficulty || 3) : (b.difficulty || 3) - (a.difficulty || 3) }
      else { av = ''; bv = '' }
      return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })

  function Th({ col, label, center }) {
    return (
      <th
        onClick={col ? () => toggleSort(col) : undefined}
        className={`py-2 px-3 font-semibold text-xs uppercase tracking-widest text-muted select-none ${center ? 'text-center' : 'text-left'} ${col ? 'cursor-pointer hover:text-primary' : ''}`}
      >
        {label}{col && <SortIcon col={col} sort={sort} />}
      </th>
    )
  }

  return (
    <div className="min-h-screen bg-base flex flex-col p-4">
      <div className="mb-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search countries…"
          className="bg-subtle border border-border-col rounded-lg px-3 py-2 text-sm text-primary placeholder:text-muted w-full max-w-sm focus:outline-none focus:border-accent"
        />
      </div>

      {loading && <div className="text-muted text-sm">Loading…</div>}
      {error && <div className="text-error text-sm">Error: {error}</div>}

      {!loading && !error && (
        <div className="overflow-y-auto flex-1 rounded-lg border border-border-col shadow-sm">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 bg-base z-10">
              <tr>
                <Th col="name"         label="Country" />
                <Th                    label="Flag" />
                <Th                    label="Map"    center />
                <Th                    label="Shape"  center />
                <Th col="continent"    label="Continent" />
                <Th col="subregion"    label="Sub-region" />
                <Th col="currency"     label="Currency" />
                <Th col="currencyCode" label="Code" />
                <Th col="language"     label="Language" />
                <Th col="capital"      label="Capital" />
                <Th col="difficulty"   label="Difficulty" center />
                <Th                    label="Cities #" center />
                <Th                    label="Cities" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const hasMissing = !c.capital || c.cityCount === 0 || !c.hasBoundary
                return (
                  <tr
                    key={c.isoA2}
                    className={`${i % 2 === 0 ? 'bg-surface' : 'bg-subtle'} hover:bg-subtle transition-colors ${hasMissing ? 'border-l-2 border-warning' : ''}`}
                  >
                    <td className="py-1.5 px-3 text-primary">{c.nameCommon}</td>
                    <td className="py-1.5 px-3">
                      {c.flagPngUrl
                        ? <img src={c.flagPngUrl} alt="" style={{ width: 30, height: 20, objectFit: 'cover', display: 'inline-block', borderRadius: 2 }} />
                        : <span className="text-muted text-xs">—</span>}
                    </td>
                    <td className="py-1.5 px-3 text-center">
                      {c.hasBoundary ? <span className="text-success font-bold">✓</span> : <span className="text-error font-bold">✗</span>}
                    </td>
                    <td className="py-1.5 px-3 text-center">
                      {c.hasBoundary ? <span className="text-success font-bold">✓</span> : <span className="text-error font-bold">✗</span>}
                    </td>
                    <td className="py-1.5 px-3 text-secondary">{c.region || <span className="text-muted">—</span>}</td>
                    <td className="py-1.5 px-3 text-secondary">{c.subregion || <span className="text-muted">—</span>}</td>
                    <td className="py-1.5 px-3 text-secondary">{c.currencyName || <span className="text-muted">—</span>}</td>
                    <td className="py-1.5 px-3 text-muted font-mono">{c.currencyCode || <span className="text-muted">—</span>}</td>
                    <td className="py-1.5 px-3 text-secondary">
                      {c.languages?.length > 0 ? c.languages.join(', ') : <span className="text-muted">—</span>}
                    </td>
                    <td className="py-1.5 px-3 text-secondary">{c.capital || <span className="text-muted">—</span>}</td>
                    <td className="py-1.5 px-3 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${DIFF_COLORS[c.difficulty || 3]}`}>
                        {DIFF_LABELS[c.difficulty || 3]}
                      </span>
                    </td>
                    <td className={`py-1.5 px-3 text-center ${c.cityCount === 0 ? 'text-muted' : 'text-secondary'}`}>
                      {c.cityCount}
                    </td>
                    <td className="py-1.5 px-3 text-secondary">
                      {c.cityNames?.length > 0 ? c.cityNames.join(', ') : <span className="text-muted">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
