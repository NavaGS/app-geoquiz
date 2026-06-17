import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Table2, Activity, SlidersHorizontal, ArrowLeft } from 'lucide-react'
import Monitoring from './Monitoring.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'
import { DIFFICULTY_LABELS, getDifficultySettings, setDifficultySettings } from '../utils/difficultySettings.js'
import { getGameplaySettings, setGameplaySettings } from '../utils/gameplaySettings.js'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080'

const NAV_ITEMS = [
  { id: 'countries', label: 'Countries', Icon: Table2 },
  { id: 'monitoring', label: 'Monitoring', Icon: Activity },
  { id: 'settings', label: 'Settings', Icon: SlidersHorizontal },
]

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
    if (sort.col !== col) return <span className="ml-1 text-muted">↕</span>
    return <span className="ml-1 text-accent">{sort.dir === 'asc' ? '↑' : '↓'}</span>
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
    <div className="min-h-screen bg-base flex flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-[220px] flex-none bg-surface border-r border-border-col min-h-screen">
        <div className="px-4 py-5 border-b border-border-col">
          <Link to="/" className="text-primary font-extrabold text-lg tracking-tight hover:text-accent transition-colors">GeoQuiz</Link>
          <p className="text-xs text-muted mt-0.5">Admin</p>
        </div>
        <nav className="flex-1 py-4">
          {NAV_ITEMS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors border-l-2 ${
                tab === id
                  ? 'border-accent text-accent bg-subtle'
                  : 'border-transparent text-secondary hover:text-primary hover:bg-subtle'
              }`}
            >
              <Icon size={16} strokeWidth={1.5} />
              {label}
            </button>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-border-col flex items-center gap-2">
          <ThemeToggle className="text-muted hover:text-primary" />
          <span className="text-xs text-muted">Theme</span>
        </div>
      </aside>

      {/* Mobile header + tab nav */}
      <div className="md:hidden flex-none">
        <header className="bg-surface border-b border-border-col h-[52px] flex items-center px-4 gap-4">
          <Link to="/" className="text-muted hover:text-primary transition-colors" aria-label="Back to home">
            <ArrowLeft size={16} strokeWidth={1.5} />
          </Link>
          <span className="font-semibold text-primary text-sm flex-1">Admin</span>
          <ThemeToggle />
        </header>
        <div className="border-b border-border-col bg-surface px-4 flex gap-4">
          {NAV_ITEMS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${tab === id ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-primary'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {tab === 'monitoring' ? (
          <Monitoring />
        ) : tab === 'settings' ? (
          <div className="flex-1 p-6 max-w-lg">
            <h2 className="text-base font-semibold text-primary mb-1">Quiz Settings</h2>
            <hr className="mb-4 border-border-col" />

            <div className="mb-4">
              <p className="text-sm font-medium text-primary mb-2">Difficulty Level:</p>
              <div className="flex flex-wrap gap-3">
                {DIFFICULTY_LABELS.map((label, i) => {
                  const val = i + 1
                  return (
                    <label key={val} className="flex items-center gap-1.5 cursor-pointer text-sm text-secondary">
                      <input
                        type="radio"
                        name="diffRating"
                        value={val}
                        checked={diffRating === val}
                        onChange={() => setDiffRating(val)}
                        className="accent-accent"
                      />
                      {label}
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm font-medium text-primary mb-2">Filter Mode:</p>
              <div className="flex flex-col gap-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="diffMode"
                    value="inclusive"
                    checked={diffMode === 'inclusive'}
                    onChange={() => setDiffMode('inclusive')}
                    className="mt-0.5 accent-accent"
                  />
                  <div>
                    <span className="text-sm font-medium text-primary">All Inclusive</span>
                    <p className="text-xs text-muted">Shows countries with difficulty ≤ selected level</p>
                  </div>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="diffMode"
                    value="exact"
                    checked={diffMode === 'exact'}
                    onChange={() => setDiffMode('exact')}
                    className="mt-0.5 accent-accent"
                  />
                  <div>
                    <span className="text-sm font-medium text-primary">Difficulty Only</span>
                    <p className="text-xs text-muted">Shows only countries matching selected level exactly</p>
                  </div>
                </label>
              </div>
            </div>

            <hr className="my-6 border-border-col" />

            <h2 className="text-base font-semibold text-primary mb-1">Quiz Settings</h2>
            <hr className="mb-4 border-border-col" />

            <div className="mb-4">
              <p className="text-sm font-medium text-primary mb-2">Mode:</p>
              <div className="flex flex-wrap gap-4">
                {[
                  { value: 'none', label: 'None' },
                  { value: 'countdown', label: 'Countdown' },
                  { value: 'maxquestions', label: 'Max Questions' },
                ].map(opt => (
                  <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer text-sm text-secondary">
                    <input
                      type="radio"
                      name="gpMode"
                      value={opt.value}
                      checked={gpMode === opt.value}
                      onChange={() => setGpMode(opt.value)}
                      className="accent-accent"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            {gpMode === 'countdown' && (
              <div className="mb-4 flex items-center gap-3">
                <label className="text-sm font-medium text-primary">Total time:</label>
                <input
                  type="number"
                  min="10"
                  max="3600"
                  value={gpCountdownSecs}
                  onChange={e => setGpCountdownSecs(Math.max(10, parseInt(e.target.value) || 60))}
                  className="w-24 bg-subtle border border-border-col rounded-lg px-3 py-1.5 text-sm text-primary focus:outline-none focus:border-accent"
                />
                <span className="text-sm text-muted">seconds</span>
              </div>
            )}

            {gpMode === 'maxquestions' && (
              <div className="flex flex-col gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-primary">Questions:</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={gpMaxQuestions}
                    onChange={e => setGpMaxQuestions(Math.max(1, parseInt(e.target.value) || 20))}
                    className="w-24 bg-subtle border border-border-col rounded-lg px-3 py-1.5 text-sm text-primary focus:outline-none focus:border-accent"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-secondary">
                  <input
                    type="checkbox"
                    checked={gpPerQTimer}
                    onChange={e => setGpPerQTimer(e.target.checked)}
                    className="accent-accent"
                  />
                  <span>Per-question timer</span>
                </label>
                {gpPerQTimer && (
                  <div className="flex items-center gap-3 ml-6">
                    <label className="text-sm font-medium text-primary">Time per question:</label>
                    <input
                      type="number"
                      min="3"
                      max="120"
                      value={gpPerQSecs}
                      onChange={e => setGpPerQSecs(Math.max(3, parseInt(e.target.value) || 15))}
                      className="w-20 bg-subtle border border-border-col rounded-lg px-3 py-1.5 text-sm text-primary focus:outline-none focus:border-accent"
                    />
                    <span className="text-sm text-muted">seconds</span>
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
              className="px-4 py-2 bg-accent text-white text-sm rounded-lg hover:opacity-90"
            >
              Save Settings
            </button>
            {savedMsg && (
              <span className="ml-3 text-sm text-success font-medium">✓ Settings saved</span>
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
                      <th className="text-left py-2 px-3 font-semibold text-xs uppercase tracking-widest text-muted cursor-pointer select-none hover:text-primary" onClick={() => toggleSort('name')}>Country<SortIcon col="name" /></th>
                      <th className="text-left py-2 px-3 font-semibold text-xs uppercase tracking-widest text-muted">Flag</th>
                      <th className="text-center py-2 px-3 font-semibold text-xs uppercase tracking-widest text-muted">Map</th>
                      <th className="text-center py-2 px-3 font-semibold text-xs uppercase tracking-widest text-muted">Shape</th>
                      <th className="text-left py-2 px-3 font-semibold text-xs uppercase tracking-widest text-muted cursor-pointer select-none hover:text-primary" onClick={() => toggleSort('continent')}>Continent<SortIcon col="continent" /></th>
                      <th className="text-left py-2 px-3 font-semibold text-xs uppercase tracking-widest text-muted cursor-pointer select-none hover:text-primary" onClick={() => toggleSort('subregion')}>Sub-region<SortIcon col="subregion" /></th>
                      <th className="text-left py-2 px-3 font-semibold text-xs uppercase tracking-widest text-muted cursor-pointer select-none hover:text-primary" onClick={() => toggleSort('currency')}>Currency<SortIcon col="currency" /></th>
                      <th className="text-left py-2 px-3 font-semibold text-xs uppercase tracking-widest text-muted cursor-pointer select-none hover:text-primary" onClick={() => toggleSort('currencyCode')}>Code<SortIcon col="currencyCode" /></th>
                      <th className="text-left py-2 px-3 font-semibold text-xs uppercase tracking-widest text-muted cursor-pointer select-none hover:text-primary" onClick={() => toggleSort('language')}>Language<SortIcon col="language" /></th>
                      <th className="text-left py-2 px-3 font-semibold text-xs uppercase tracking-widest text-muted cursor-pointer select-none hover:text-primary" onClick={() => toggleSort('capital')}>Capital<SortIcon col="capital" /></th>
                      <th className="text-center py-2 px-3 font-semibold text-xs uppercase tracking-widest text-muted cursor-pointer select-none hover:text-primary" onClick={() => toggleSort('difficulty')}>Difficulty<SortIcon col="difficulty" /></th>
                      <th className="text-center py-2 px-3 font-semibold text-xs uppercase tracking-widest text-muted">Cities #</th>
                      <th className="text-left py-2 px-3 font-semibold text-xs uppercase tracking-widest text-muted">Cities</th>
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
                          <td className="py-1.5 px-3 text-sm text-primary">{c.nameCommon}</td>
                          <td className="py-1.5 px-3 text-sm">
                            {c.flagPngUrl
                              ? <img src={c.flagPngUrl} alt="" style={{ width: 30, height: 20, objectFit: 'cover', display: 'inline-block', borderRadius: 2 }} />
                              : <span className="text-muted text-xs">—</span>
                            }
                          </td>
                          <td className="py-1.5 px-3 text-sm text-center">
                            {c.hasBoundary
                              ? <span className="text-success font-bold">✓</span>
                              : <span className="text-error font-bold">✗</span>
                            }
                          </td>
                          <td className="py-1.5 px-3 text-sm text-center">
                            {c.hasBoundary
                              ? <span className="text-success font-bold">✓</span>
                              : <span className="text-error font-bold">✗</span>
                            }
                          </td>
                          <td className="py-1.5 px-3 text-sm text-secondary">{c.region || <span className="text-muted">—</span>}</td>
                          <td className="py-1.5 px-3 text-sm text-secondary">{c.subregion || <span className="text-muted">—</span>}</td>
                          <td className="py-1.5 px-3 text-sm text-secondary">
                            {c.currencyName || <span className="text-muted">—</span>}
                          </td>
                          <td className="py-1.5 px-3 text-sm text-muted font-mono">
                            {c.currencyCode || <span className="text-muted">—</span>}
                          </td>
                          <td className="py-1.5 px-3 text-sm text-secondary">
                            {c.languages && c.languages.length > 0
                              ? c.languages.join(', ')
                              : <span className="text-muted">—</span>}
                          </td>
                          <td className="py-1.5 px-3 text-sm text-secondary">
                            {c.capital || <span className="text-muted">—</span>}
                          </td>
                          <td className="py-1.5 px-3 text-sm text-center">
                            {(() => {
                              const d = c.difficulty || 3
                              const colors = ['','bg-green-100 text-green-700','bg-green-100 text-green-600','bg-yellow-100 text-yellow-700','bg-orange-100 text-orange-700','bg-red-100 text-red-700']
                              const labels = ['','Very Easy','Easy','Medium','Hard','Very Hard']
                              return <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${colors[d]}`}>{labels[d]}</span>
                            })()}
                          </td>
                          <td className={`py-1.5 px-3 text-sm text-center ${c.cityCount === 0 ? 'text-muted' : 'text-secondary'}`}>
                            {c.cityCount}
                          </td>
                          <td className="py-1.5 px-3 text-sm text-secondary">
                            {c.cityNames && c.cityNames.length > 0
                              ? c.cityNames.join(', ')
                              : <span className="text-muted">—</span>
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
    </div>
  )
}
