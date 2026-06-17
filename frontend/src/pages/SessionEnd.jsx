import { useLocation, useNavigate } from 'react-router-dom'
import { Trophy } from 'lucide-react'

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

export default function SessionEnd() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state || {}
  const { score = { correct: 0, wrong: 0, skipped: 0 }, mode, region, isNewBest } = state

  const total = score.correct + score.wrong + score.skipped
  const accuracy = total > 0 ? Math.round((score.correct / total) * 100) : 0

  // SVG radial progress ring
  const R = 54
  const circumference = 2 * Math.PI * R
  const dashOffset = circumference * (1 - accuracy / 100)

  return (
    <div className="min-h-screen bg-base flex flex-col">
      {/* Zone 1 — Score hero (always dark) */}
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

      {/* Zone 2 — Breakdown */}
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

      {/* Zone 3 — Actions */}
      <div className="bg-base px-4 pb-8 flex flex-col gap-3 max-w-sm mx-auto w-full">
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
