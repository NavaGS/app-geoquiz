import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { api } from '../api/client.js'

const LEADERBOARD_MODES = [
  { key: 'flags',    label: 'Flag Finder',    icon: '🏳️',  description: 'Name the country from its flag' },
  { key: 'map',      label: 'World Map',      icon: '🗺️',  description: 'Click the correct country on the map' },
  { key: 'shapes',   label: 'Country Shape',  icon: '🔷',  description: 'Identify a country from its silhouette' },
  { key: 'capitals', label: 'Capital City',   icon: '🏛️',  description: 'Name the capital of each country' },
]

const MEDALS = ['🥇', '🥈', '🥉']

const RANK_CARD = [
  'border border-yellow-500/50 bg-yellow-500/10',
  'border border-slate-400/40 bg-slate-400/10',
  'border border-orange-500/40 bg-orange-500/10',
]

const RANK_NUMBER = [
  'text-yellow-400',
  'text-slate-300',
  'text-orange-400',
]

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

function EmptyLeaderboard({ mode }) {
  return (
    <div className="bg-surface border border-border-col rounded-xl p-10 text-center space-y-2">
      <p className="text-3xl">{LEADERBOARD_MODES.find(m => m.key === mode)?.icon}</p>
      <p className="text-primary font-semibold">No scores yet</p>
      <p className="text-muted text-sm">Play a Countdown session to claim the top spot</p>
    </div>
  )
}

function LeaderboardRow({ entry, index }) {
  const isTop = index < 3
  return (
    <div className={`flex items-center gap-4 rounded-xl px-4 py-3 transition-colors ${
      isTop ? RANK_CARD[index] : 'bg-surface border border-border-col hover:bg-subtle'
    }`}>
      {/* Rank */}
      <div className="w-8 text-center shrink-0">
        {isTop
          ? <span className="text-xl leading-none">{MEDALS[index]}</span>
          : <span className={`font-mono text-sm font-bold ${RANK_NUMBER[index] ?? 'text-muted'}`}>{entry.rank}</span>
        }
      </div>

      {/* Score */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className={`text-2xl font-extrabold font-mono leading-none ${isTop ? RANK_NUMBER[index] : 'text-primary'}`}>
            {entry.correct}
          </span>
          <span className="text-xs text-muted">/ {entry.total} correct</span>
        </div>
      </div>

      {/* Accuracy pill */}
      <div className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold font-mono ${
        entry.accuracy >= 80 ? 'bg-success/15 text-success' :
        entry.accuracy >= 50 ? 'bg-warning/15 text-warning' :
                               'bg-error/15 text-error'
      }`}>
        {entry.accuracy}%
      </div>

      {/* Region + time */}
      <div className="text-right shrink-0 hidden sm:block space-y-0.5">
        <p className="text-xs font-mono text-secondary">{entry.region || 'All'}</p>
        <p className="text-xs text-muted">{timeAgo(entry.playedAt)}</p>
      </div>
    </div>
  )
}

export default function GameAnalytics() {
  const [activeMode, setActiveMode] = useState('flags')
  const [leaderboard, setLeaderboard] = useState([])
  const [publicStats, setPublicStats] = useState(null)
  const [lbLoading, setLbLoading] = useState(true)

  useEffect(() => {
    api.getPublicStats().then(setPublicStats).catch(() => {})
  }, [])

  useEffect(() => {
    setLbLoading(true)
    setLeaderboard([])
    api.getLeaderboard(activeMode)
      .then(data => { setLeaderboard(data); setLbLoading(false) })
      .catch(() => { setLeaderboard([]); setLbLoading(false) })
  }, [activeMode])

  const activePlayers = publicStats?.activePlayers ?? 0
  const modeAccData = publicStats
    ? Object.entries(publicStats.modeAccuracy || {}).map(([mode, accuracy]) => ({ mode, accuracy: Math.round(accuracy) }))
    : []

  const currentMode = LEADERBOARD_MODES.find(m => m.key === activeMode)

  return (
    <div className="min-h-screen bg-base">

      {/* ── Hero ── */}
      <div className="bg-[#060E1C] border-b border-border-col px-6 py-12 text-center">
        <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-3">GeoQuiz · Global Rankings</p>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">Who knows the world best?</h1>
        <p className="text-slate-400 text-sm mt-3 max-w-sm mx-auto">
          Top scores from Countdown sessions — 60 seconds, as many countries as you can
        </p>

        {activePlayers > 0 && (
          <div className="mt-5 inline-flex items-center gap-2 bg-success/10 border border-success/30 text-success text-xs font-semibold rounded-full px-4 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success inline-block animate-pulse" />
            {activePlayers} {activePlayers === 1 ? 'player' : 'players'} active right now
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">

        {/* ── Mode tabs ── */}
        <div className="flex gap-2 flex-wrap">
          {LEADERBOARD_MODES.map(m => (
            <button
              key={m.key}
              onClick={() => setActiveMode(m.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${
                activeMode === m.key
                  ? 'bg-accent text-white border-accent shadow-sm'
                  : 'bg-surface border-border-col text-secondary hover:text-primary hover:bg-subtle'
              }`}
            >
              <span className="text-base leading-none">{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>

        {/* ── Leaderboard ── */}
        <section>
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-primary">{currentMode?.icon} {currentMode?.label}</h2>
              <p className="text-xs text-muted mt-0.5">{currentMode?.description}</p>
            </div>
            <span className="text-xs text-muted">Top 10 all-time</span>
          </div>

          {lbLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-surface border border-border-col animate-pulse" />
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            <EmptyLeaderboard mode={activeMode} />
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry, i) => (
                <LeaderboardRow key={i} entry={entry} index={i} />
              ))}
            </div>
          )}
        </section>

        {/* ── Community Stats ── */}
        {publicStats && (
          <section className="space-y-8 pt-2 border-t border-border-col">
            <h2 className="text-xs font-semibold text-muted uppercase tracking-widest pt-4">Community Stats</h2>

            {/* Accuracy by mode */}
            {modeAccData.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-primary mb-3">Answer Accuracy by Mode</p>
                <div className="bg-surface border border-border-col rounded-xl p-4">
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={modeAccData} barSize={28}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="mode" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                      <Tooltip
                        contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }}
                        formatter={(v) => [`${v}%`, 'Accuracy']}
                      />
                      <Bar dataKey="accuracy" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Hardest Countries */}
            {publicStats.hardestCountries?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-primary mb-3">Hardest Countries</p>
                <div className="bg-surface border border-border-col rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-subtle border-b border-border-col">
                        <th className="py-2.5 px-4 text-left text-muted text-xs uppercase tracking-widest">#</th>
                        <th className="py-2.5 px-4 text-left text-muted text-xs uppercase tracking-widest">Country</th>
                        <th className="py-2.5 px-4 text-left text-muted text-xs uppercase tracking-widest hidden sm:table-cell">Attempts</th>
                        <th className="py-2.5 px-4 text-right text-muted text-xs uppercase tracking-widest">Accuracy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {publicStats.hardestCountries.map((c, i) => (
                        <tr key={c.iso} className="border-b border-border-col last:border-0 hover:bg-subtle transition-colors">
                          <td className="py-2.5 px-4 text-muted text-xs">{i + 1}</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-primary text-sm">{c.iso}</td>
                          <td className="py-2.5 px-4 text-secondary text-xs hidden sm:table-cell">{c.total} attempts</td>
                          <td className="py-2.5 px-4 text-right">
                            <span className="font-mono text-xs font-semibold text-error">{c.accuracy?.toFixed(1)}%</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Mode popularity grid */}
            {publicStats.modePopularity && Object.keys(publicStats.modePopularity).length > 0 && (
              <div>
                <p className="text-sm font-semibold text-primary mb-3">Most Played Modes</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(publicStats.modePopularity)
                    .sort(([, a], [, b]) => b - a)
                    .map(([mode, count]) => (
                      <div key={mode} className="bg-surface border border-border-col rounded-xl p-3 text-center">
                        <p className="text-xl font-extrabold text-accent font-mono">{count}</p>
                        <p className="text-xs text-muted mt-0.5 capitalize">{mode}</p>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
