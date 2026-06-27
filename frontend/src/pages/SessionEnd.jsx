import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Trophy } from 'lucide-react'
import { api } from '../api/client.js'
import ShapeSvg from '../components/ShapeSvg.jsx'

const MODE_NAMES = {
  flags: 'Flag Finder',
  map: 'World Map',
  capitals: 'Capital City',
  cities: 'Major Cities',
  shapes: 'Country Shape',
  currency: 'Currency',
  language: 'Language',
  borders: 'Borders',
}

function CardCell({ entry, mode, country, shapeCache }) {
  if (mode === 'cities' && entry.card?.cityName) {
    return <span className="text-xs font-medium text-primary">{entry.card.cityName}</span>
  }
  if (mode === 'shapes') {
    const shape = shapeCache[entry.countryIso]
    if (shape) return (
      <div style={{ width: 44, height: 32 }}>
        <ShapeSvg geojsonStr={shape.geojson} height={32} />
      </div>
    )
    return <span className="text-xs text-muted">{country?.nameCommon ?? entry.countryIso}</span>
  }
  if (mode === 'currency' && country) {
    return (
      <div>
        <p className="text-xs font-semibold text-primary leading-tight">{country.currencySymbol || country.currencyCode}</p>
        <p className="text-xs text-muted leading-tight truncate">{country.currencyName}</p>
      </div>
    )
  }
  if (!country) return <span className="text-xs text-muted">{entry.countryIso}</span>
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      {country.flagPngUrl && (
        <img
          src={country.flagPngUrl}
          alt=""
          style={{ width: 26, height: 17, objectFit: 'cover', flexShrink: 0 }}
          className="rounded-sm border border-border-col"
        />
      )}
      <span className="text-xs text-primary truncate">{country.nameCommon}</span>
    </div>
  )
}

export default function SessionEnd() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state || {}
  const { score = { correct: 0, wrong: 0, skipped: 0 }, mode, region, isNewBest, results = [] } = state

  const total = score.correct + score.wrong + score.skipped
  const accuracy = total > 0 ? Math.round((score.correct / total) * 100) : 0

  const [countryMap, setCountryMap] = useState({})
  const [shapeCache, setShapeCache] = useState({})

  useEffect(() => {
    if (!results.length || !region) return
    api.getCountries(region).then(data => {
      const map = {}
      data.forEach(c => { map[c.isoA2] = c })
      setCountryMap(map)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (mode !== 'shapes' || !results.length) return
    const isos = [...new Set(results.map(r => r.countryIso))]
    Promise.all(
      isos.map(iso => api.getShape(iso).then(d => [iso, d]).catch(() => [iso, null]))
    ).then(entries => {
      const cache = {}
      entries.forEach(([iso, d]) => { if (d) cache[iso] = d })
      setShapeCache(cache)
    })
  }, [])

  const R = 54
  const circumference = 2 * Math.PI * R
  const dashOffset = circumference * (1 - accuracy / 100)

  return (
    <div className="min-h-screen bg-base flex flex-col">
      {/* Score hero */}
      <div className="bg-[#0F1829] flex flex-col items-center justify-center py-12 px-4 gap-3">
        <div className="relative w-32 h-32">
          <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
            <circle cx="64" cy="64" r={R} fill="none" stroke="#1E2E47" strokeWidth="8" />
            <circle
              cx="64" cy="64" r={R}
              fill="none"
              stroke="#4F70FF"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-extrabold text-white font-sans tracking-tight">{accuracy}%</span>
          </div>
        </div>
        <p className="text-white font-bold text-xl tracking-tight">Session Complete</p>
        <p className="text-slate-400 text-sm">{MODE_NAMES[mode] || mode} · {region}</p>
      </div>

      {/* Score breakdown */}
      <div className="bg-base px-4 py-6 flex flex-col items-center gap-4">
        {isNewBest && (
          <div className="flex items-center gap-2 bg-warning/10 border border-warning rounded-lg px-4 py-2 w-full max-w-sm">
            <Trophy size={16} className="text-warning" strokeWidth={1.5} />
            <span className="text-warning font-semibold text-sm">New Personal Best!</span>
          </div>
        )}
        <div className="flex gap-3 justify-center">
          <span className="bg-surface border border-border-col rounded-lg px-4 py-3 text-center min-w-[72px]">
            <p className="text-2xl font-bold text-success">{score.correct}</p>
            <p className="text-xs text-muted mt-0.5">Correct</p>
          </span>
          <span className="bg-surface border border-border-col rounded-lg px-4 py-3 text-center min-w-[72px]">
            <p className="text-2xl font-bold text-error">{score.wrong}</p>
            <p className="text-xs text-muted mt-0.5">Wrong</p>
          </span>
          <span className="bg-surface border border-border-col rounded-lg px-4 py-3 text-center min-w-[72px]">
            <p className="text-2xl font-bold text-muted">{score.skipped}</p>
            <p className="text-xs text-muted mt-0.5">Skipped</p>
          </span>
        </div>
      </div>

      {/* Per-question results */}
      {results.length > 0 && (
        <div className="px-4 pb-4 max-w-lg mx-auto w-full">
          <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-2">Results</p>
          <div className="rounded-lg overflow-hidden border border-border-col">
            <div className="grid grid-cols-3 bg-surface px-3 py-2 text-xs font-medium text-muted border-b border-border-col">
              <span>Card</span>
              <span>Your answer</span>
              <span>Answer</span>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 360 }}>
              {results.map((entry, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-3 px-3 py-2.5 items-center gap-2 border-t border-border-col ${i % 2 === 0 ? 'bg-base' : 'bg-surface/40'}`}
                >
                  <div className="min-w-0">
                    <CardCell entry={entry} mode={mode} country={countryMap[entry.countryIso]} shapeCache={shapeCache} />
                  </div>
                  <div className="min-w-0">
                    {entry.resultType === 'SKIP'
                      ? <span className="text-xs text-muted italic">Skipped</span>
                      : entry.resultType === 'CORRECT'
                      ? <span className="text-xs text-success break-words">{entry.userAnswer || '—'}</span>
                      : <span className="text-xs text-error break-words">{entry.userAnswer || '—'}</span>
                    }
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs text-primary break-words">{entry.canonicalName || '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-base px-4 pb-8 pt-2 flex flex-col gap-3 max-w-sm mx-auto w-full">
        <button
          onClick={() => navigate(`/quiz/${mode}`, { state: { region, timer: 30 } })}
          className="w-full py-3 bg-accent text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          Play Again
        </button>
        <button
          onClick={() => navigate('/')}
          className="w-full py-3 bg-surface border border-border-col text-primary rounded-lg font-semibold hover:bg-subtle transition-colors"
        >
          All Quizzes
        </button>
      </div>
    </div>
  )
}
