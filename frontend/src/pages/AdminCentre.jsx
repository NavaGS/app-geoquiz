import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Monitoring from './Monitoring.jsx'
import { DIFFICULTY_LABELS, getDifficultySettings, setDifficultySettings } from '../utils/difficultySettings.js'
import { getGameplaySettings, setGameplaySettings } from '../utils/gameplaySettings.js'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export default function AdminCentre() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('countries')
  const [countries, setCountries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [diffRating, setDiffRating] = useState(5)
  const [diffMode, setDiffMode] = useState('inclusive')
  const [savedMsg, setSavedMsg] = useState(false)
  const [gpMode, setGpMode] = useState('none')
  const [gpCountdownSecs, setGpCountdownSecs] = useState(60)
  const [gpMaxQuestions, setGpMaxQuestions] = useState(20)
  const [gpPerQTimer, setGpPerQTimer] = useState(false)
  const [gpPerQSecs, setGpPerQSecs] = useState(15)
  const [sort, setSort] = useState({ col: 'name', dir: 'asc' })

  function toggleSort(col) {
    setSort(prev => prev.col === col
      ? { col, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      : { col, dir: 'asc' }
    )
  }

  function SortIcon({ col }) {
    if (sort.col !== col) return <span className="ml-1 text-gray-300">↕</span>
    return <span className="ml-1">{sort.dir === 'asc' ? '↑' : '↓'}</span>
  }

  useEffect(() => {
    const s = getDifficultySettings()
    setDiffRating(s.rating)
    setDiffMode(s.mode)
    const gp = getGameplaySettings()
    setGpMode(gp.mode)
    setGpCountdownSecs(gp.countdownSecs)
    setGpMaxQuestions(gp.maxQuestions)
    setGpPerQTimer(gp.perQuestionTimer)
    setGpPerQSecs(gp.perQuestionSecs)
  }, [])

  useEffect(() => {
    fetch(`${API_BASE}/admin/countries-data`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(data => { setCountries(data); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  const filtered = countries
    .filter(c => c.nameCommon.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let av, bv
      if (sort.col === 'name') { av = a.nameCommon || ''; bv = b.nameCommon || '' }
      else if (sort.col === 'capital') { av = a.capital || ''; bv = b.capital || '' }
      else if (sort.col === 'continent') { av = a.region || ''; bv = b.region || '' }
      else if (sort.col === 'subregion') { av = a.subregion || ''; bv = b.subregion || '' }
      else if (sort.col === 'currency') { av = a.currencyName || ''; bv = b.currencyName || '' }
      else if (sort.col === 'currencyCode') { av = a.currencyCode || ''; bv = b.currencyCode || '' }
      else if (sort.col === 'language') { av = (a.languages || []).join(', '); bv = (b.languages || []).join(', ') }
      else if (sort.col === 'difficulty') { av = a.difficulty || 3; bv = b.difficulty || 3; return sort.dir === 'asc' ? av - bv : bv - av }
      return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-800">← Home</button>
        <h1 className="text-lg font-semibold text-gray-800">Admin Centre</h1>
        <span />
      </header>

      <div className="border-b border-gray-200 bg-white px-4 flex gap-4">
        <button
          onClick={() => setTab('countries')}
          className={`py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'countries' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Countries Data
        </button>
        <button
          onClick={() => setTab('monitoring')}
          className={`py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'monitoring' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Monitoring
        </button>
        <button
          onClick={() => setTab('settings')}
          className={`py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'settings' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Settings
        </button>
      </div>

      {tab === 'monitoring' ? (
        <Monitoring />
      ) : tab === 'settings' ? (
        <div className="flex-1 p-6 max-w-lg">
          <h2 className="text-base font-semibold text-gray-800 mb-1">Quiz Difficulty Filter</h2>
          <hr className="mb-4 border-gray-200" />

          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Difficulty Level:</p>
            <div className="flex flex-wrap gap-3">
              {DIFFICULTY_LABELS.map((label, i) => {
                const val = i + 1
                return (
                  <label key={val} className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-700">
                    <input
                      type="radio"
                      name="diffRating"
                      value={val}
                      checked={diffRating === val}
                      onChange={() => setDiffRating(val)}
                      className="accent-blue-500"
                    />
                    {label}
                  </label>
                )
              })}
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">Filter Mode:</p>
            <div className="flex flex-col gap-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="diffMode"
                  value="inclusive"
                  checked={diffMode === 'inclusive'}
                  onChange={() => setDiffMode('inclusive')}
                  className="mt-0.5 accent-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">All Inclusive</span>
                  <p className="text-xs text-gray-500">Shows countries with difficulty ≤ selected level</p>
                </div>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="diffMode"
                  value="exact"
                  checked={diffMode === 'exact'}
                  onChange={() => setDiffMode('exact')}
                  className="mt-0.5 accent-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Difficulty Only</span>
                  <p className="text-xs text-gray-500">Shows only countries matching selected level exactly</p>
                </div>
              </label>
            </div>
          </div>

          <hr className="my-6 border-gray-200" />

          <h2 className="text-base font-semibold text-gray-800 mb-1">Game Play Mode</h2>
          <hr className="mb-4 border-gray-200" />

          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Mode:</p>
            <div className="flex flex-wrap gap-4">
              {[
                { value: 'none', label: 'None' },
                { value: 'countdown', label: 'Countdown' },
                { value: 'maxquestions', label: 'Max Questions' },
              ].map(opt => (
                <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-700">
                  <input
                    type="radio"
                    name="gpMode"
                    value={opt.value}
                    checked={gpMode === opt.value}
                    onChange={() => setGpMode(opt.value)}
                    className="accent-blue-500"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {gpMode === 'countdown' && (
            <div className="mb-4 flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Total time:</label>
              <input
                type="number"
                min="10"
                max="3600"
                value={gpCountdownSecs}
                onChange={e => setGpCountdownSecs(Math.max(10, parseInt(e.target.value) || 60))}
                className="w-24 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <span className="text-sm text-gray-500">seconds</span>
            </div>
          )}

          {gpMode === 'maxquestions' && (
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Questions:</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={gpMaxQuestions}
                  onChange={e => setGpMaxQuestions(Math.max(1, parseInt(e.target.value) || 20))}
                  className="w-24 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={gpPerQTimer}
                  onChange={e => setGpPerQTimer(e.target.checked)}
                  className="accent-blue-500"
                />
                <span>Per-question timer</span>
              </label>
              {gpPerQTimer && (
                <div className="flex items-center gap-3 ml-6">
                  <label className="text-sm font-medium text-gray-700">Time per question:</label>
                  <input
                    type="number"
                    min="3"
                    max="120"
                    value={gpPerQSecs}
                    onChange={e => setGpPerQSecs(Math.max(3, parseInt(e.target.value) || 15))}
                    className="w-20 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <span className="text-sm text-gray-500">seconds</span>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => {
              setDifficultySettings(diffRating, diffMode)
              setGameplaySettings({
                mode: gpMode,
                countdownSecs: gpCountdownSecs,
                maxQuestions: gpMaxQuestions,
                perQuestionTimer: gpPerQTimer,
                perQuestionSecs: gpPerQSecs,
              })
              setSavedMsg(true)
              setTimeout(() => setSavedMsg(false), 2000)
            }}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            Save Settings
          </button>
          {savedMsg && (
            <span className="ml-3 text-sm text-green-600 font-medium">✓ Settings saved</span>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden p-4">
          <div className="mb-3">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search countries…"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {loading && <div className="text-gray-500 text-sm">Loading…</div>}
          {error && <div className="text-red-500 text-sm">Error: {error}</div>}

          {!loading && !error && (
            <div className="overflow-y-auto flex-1 rounded-lg border border-gray-200 shadow-sm">
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 bg-gray-100 z-10">
                  <tr>
                    <th className="text-left py-2 px-3 font-semibold text-xs uppercase tracking-wide text-gray-600 cursor-pointer select-none hover:text-gray-800" onClick={() => toggleSort('name')}>Country<SortIcon col="name" /></th>
                    <th className="text-left py-2 px-3 font-semibold text-xs uppercase tracking-wide text-gray-600">Flag</th>
                    <th className="text-center py-2 px-3 font-semibold text-xs uppercase tracking-wide text-gray-600">Map</th>
                    <th className="text-center py-2 px-3 font-semibold text-xs uppercase tracking-wide text-gray-600">Shape</th>
                    <th className="text-left py-2 px-3 font-semibold text-xs uppercase tracking-wide text-gray-600 cursor-pointer select-none hover:text-gray-800" onClick={() => toggleSort('continent')}>Continent<SortIcon col="continent" /></th>
                    <th className="text-left py-2 px-3 font-semibold text-xs uppercase tracking-wide text-gray-600 cursor-pointer select-none hover:text-gray-800" onClick={() => toggleSort('subregion')}>Sub-region<SortIcon col="subregion" /></th>
                    <th className="text-left py-2 px-3 font-semibold text-xs uppercase tracking-wide text-gray-600 cursor-pointer select-none hover:text-gray-800" onClick={() => toggleSort('currency')}>Currency<SortIcon col="currency" /></th>
                    <th className="text-left py-2 px-3 font-semibold text-xs uppercase tracking-wide text-gray-600 cursor-pointer select-none hover:text-gray-800" onClick={() => toggleSort('currencyCode')}>Code<SortIcon col="currencyCode" /></th>
                    <th className="text-left py-2 px-3 font-semibold text-xs uppercase tracking-wide text-gray-600 cursor-pointer select-none hover:text-gray-800" onClick={() => toggleSort('language')}>Language<SortIcon col="language" /></th>
                    <th className="text-left py-2 px-3 font-semibold text-xs uppercase tracking-wide text-gray-600 cursor-pointer select-none hover:text-gray-800" onClick={() => toggleSort('capital')}>Capital<SortIcon col="capital" /></th>
                    <th className="text-center py-2 px-3 font-semibold text-xs uppercase tracking-wide text-gray-600 cursor-pointer select-none hover:text-gray-800" onClick={() => toggleSort('difficulty')}>Difficulty<SortIcon col="difficulty" /></th>
                    <th className="text-center py-2 px-3 font-semibold text-xs uppercase tracking-wide text-gray-600">Cities #</th>
                    <th className="text-left py-2 px-3 font-semibold text-xs uppercase tracking-wide text-gray-600">Cities</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => {
                    const hasMissing = !c.capital || c.cityCount === 0 || !c.hasBoundary
                    return (
                      <tr
                        key={c.isoA2}
                        className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${hasMissing ? 'border-l-2 border-amber-300' : ''}`}
                      >
                        <td className="py-1.5 px-3 text-sm">{c.nameCommon}</td>
                        <td className="py-1.5 px-3 text-sm">
                          {c.flagPngUrl
                            ? <img src={c.flagPngUrl} alt="" style={{ width: 30, height: 20, objectFit: 'cover', display: 'inline-block', borderRadius: 2 }} />
                            : <span className="text-gray-300 text-xs">—</span>
                          }
                        </td>
                        <td className="py-1.5 px-3 text-sm text-center">
                          {c.hasBoundary
                            ? <span className="text-green-600 font-bold">✓</span>
                            : <span className="text-red-400 font-bold">✗</span>
                          }
                        </td>
                        <td className="py-1.5 px-3 text-sm text-center">
                          {c.hasBoundary
                            ? <span className="text-green-600 font-bold">✓</span>
                            : <span className="text-red-400 font-bold">✗</span>
                          }
                        </td>
                        <td className="py-1.5 px-3 text-sm">{c.region || <span className="text-gray-400">—</span>}</td>
                        <td className="py-1.5 px-3 text-sm">{c.subregion || <span className="text-gray-400">—</span>}</td>
                        <td className="py-1.5 px-3 text-sm">
                          {c.currencyName || <span className="text-gray-400">—</span>}
                        </td>
                        <td className="py-1.5 px-3 text-sm text-gray-500">
                          {c.currencyCode || <span className="text-gray-400">—</span>}
                        </td>
                        <td className="py-1.5 px-3 text-sm">
                          {c.languages && c.languages.length > 0
                            ? c.languages.join(', ')
                            : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="py-1.5 px-3 text-sm">
                          {c.capital || <span className="text-gray-400">—</span>}
                        </td>
                        <td className="py-1.5 px-3 text-sm text-center">
                          {(() => {
                            const d = c.difficulty || 3
                            const colors = ['','bg-green-100 text-green-700','bg-green-100 text-green-600','bg-yellow-100 text-yellow-700','bg-orange-100 text-orange-700','bg-red-100 text-red-700']
                            const labels = ['','Very Easy','Easy','Medium','Hard','Very Hard']
                            return <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${colors[d]}`}>{labels[d]}</span>
                          })()}
                        </td>
                        <td className={`py-1.5 px-3 text-sm text-center ${c.cityCount === 0 ? 'text-gray-400' : ''}`}>
                          {c.cityCount}
                        </td>
                        <td className="py-1.5 px-3 text-sm">
                          {c.cityNames && c.cityNames.length > 0
                            ? c.cityNames.join(', ')
                            : <span className="text-gray-400">—</span>
                          }
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
