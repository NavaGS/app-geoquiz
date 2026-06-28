import { useState, useEffect, useRef } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { api, SSE_URL } from '../api/client.js'

function SectionHeading({ children }) {
  return (
    <div className="col-span-full mt-2 first:mt-0">
      <p className="text-xs font-semibold text-muted uppercase tracking-widest pb-2 border-b border-border-col">{children}</p>
    </div>
  )
}

function Tile({ title, description, children, wide }) {
  return (
    <div className={`bg-surface border border-border-col rounded-xl shadow-sm p-5 ${wide ? 'col-span-1 md:col-span-2 lg:col-span-3' : ''}`}>
      <div className="mb-3">
        <p className="font-semibold text-primary text-sm">{title}</p>
        {description && <p className="text-xs text-muted mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

export default function Monitoring() {
  const [stats, setStats] = useState(null)
  const [liveEvents, setLiveEvents] = useState([])
  const [error, setError] = useState(null)
  const sseRef = useRef()

  function loadStats() {
    api.getStats()
      .then(setStats)
      .catch(e => setError(e.message))
  }

  useEffect(() => {
    loadStats()
    const interval = setInterval(loadStats, 30000)

    const sse = new EventSource(SSE_URL)
    sseRef.current = sse
    sse.addEventListener('stats', e => {
      try {
        const data = JSON.parse(e.data)
        setStats(data)
        setLiveEvents(prev => [
          { time: new Date().toLocaleTimeString(), ...data },
          ...prev.slice(0, 49),
        ])
      } catch {}
    })
    sse.onerror = () => {}

    return () => {
      clearInterval(interval)
      sse.close()
    }
  }, [])

  const modePop = stats ? Object.entries(stats.modePopularity || {}).map(([mode, count]) => ({ mode, count })) : []
  const modeAcc = stats ? Object.entries(stats.modeAccuracy || {}).map(([mode, accuracy]) => ({ mode, accuracy: Math.round(accuracy) })) : []
  const skipRateData = stats ? Object.entries(stats.skipRateByMode || {}).map(([mode, rate]) => ({ mode, rate: Math.round(rate) })) : []

  const requestStatus = stats?.errorRates ? (() => {
    const total = stats.errorRates.total || 0
    const bad = ((stats.errorRates.rate4xx || 0) + (stats.errorRates.rate5xx || 0)) / 100 * total
    const ok = total - bad
    const pct2xx = total > 0 ? Math.round((ok / total) * 100) : null
    return { total, pct2xx, rate4xx: stats.errorRates.rate4xx, rate5xx: stats.errorRates.rate5xx }
  })() : null

  return (
    <div className="min-h-screen bg-base">
      {error && <div className="m-4 bg-error/10 text-error border border-error/30 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <div className="flex justify-end px-6 pt-4">
        <button onClick={loadStats} className="text-xs text-accent hover:opacity-80 font-medium">Refresh</button>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-4 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

        {/* ── Player Activity ── */}
        <SectionHeading>Player Activity</SectionHeading>

        <Tile
          title="Active Sessions"
          description="Number of quiz sessions started in each time window"
        >
          {stats ? (
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: '5 min', val: stats.activeSessions?.last5min },
                { label: '30 min', val: stats.activeSessions?.last30min },
                { label: '60 min', val: stats.activeSessions?.last60min },
              ].map(({ label, val }) => (
                <div key={label} className="bg-subtle rounded-lg py-3">
                  <p className="text-2xl font-bold text-accent font-mono">{val ?? '—'}</p>
                  <p className="text-xs text-muted mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          ) : <p className="text-muted text-sm">Loading…</p>}
        </Tile>

        <Tile
          title="Session Funnel"
          description="Quiz sessions started vs completed all-time"
        >
          {stats?.sessionFunnel ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">Started</span>
                <span className="font-bold font-mono text-primary">{stats.sessionFunnel.started}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">Completed</span>
                <span className="font-bold font-mono text-success">{stats.sessionFunnel.completed}</span>
              </div>
              <div className="pt-2 border-t border-border-col flex justify-between items-center">
                <span className="text-sm text-muted">Completion rate</span>
                <span className="font-bold font-mono text-accent">
                  {stats.sessionFunnel.started > 0 ? `${stats.sessionFunnel.completionRate?.toFixed(1)}%` : '—'}
                </span>
              </div>
            </div>
          ) : <p className="text-muted text-sm">No data yet</p>}
        </Tile>

        <Tile
          title="Skip Rate by Mode"
          description="Percentage of questions skipped per quiz mode"
          wide
        >
          {skipRateData.length > 0 ? (
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={skipRateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="mode" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }} formatter={(v) => `${v}%`} />
                <Bar dataKey="rate" fill="var(--warning)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-muted text-sm">No data yet</p>}
        </Tile>

        <Tile
          title="Quiz Mode Popularity"
          description="Total sessions started per quiz mode across all time"
          wide
        >
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={modePop}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="mode" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }} />
              <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Tile>

        <Tile
          title="Answer Accuracy by Mode"
          description="Percentage of correct answers per quiz mode across all players"
          wide
        >
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={modeAcc}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="mode" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }} formatter={(v) => `${v}%`} />
              <Bar dataKey="accuracy" fill="var(--success)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Tile>

        <Tile
          title="Hardest Countries"
          description="Countries with the lowest answer accuracy (min. 5 attempts)"
          wide
        >
          {stats?.hardestCountries?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-border-col">
                    <th className="py-2 pr-4 text-muted text-xs uppercase tracking-widest">#</th>
                    <th className="py-2 pr-4 text-muted text-xs uppercase tracking-widest">Country</th>
                    <th className="py-2 pr-4 text-muted text-xs uppercase tracking-widest">Attempts</th>
                    <th className="py-2 pr-4 text-muted text-xs uppercase tracking-widest">Correct</th>
                    <th className="py-2 text-muted text-xs uppercase tracking-widest">Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.hardestCountries.map((c, i) => (
                    <tr key={c.iso} className="border-b border-border-col last:border-0 hover:bg-subtle transition-colors">
                      <td className="py-2 pr-4 text-muted">{i + 1}</td>
                      <td className="py-2 pr-4 font-mono font-semibold text-primary">{c.iso}</td>
                      <td className="py-2 pr-4 text-secondary">{c.total}</td>
                      <td className="py-2 pr-4 text-success">{c.correct}</td>
                      <td className="py-2 text-error font-mono">{c.accuracy?.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-muted text-sm">No data yet</p>}
        </Tile>

        {/* ── Application Performance ── */}
        <SectionHeading>Application Performance</SectionHeading>

        <Tile
          title="API Response Times"
          description="Backend latency percentiles — p50 is typical, p99 is worst-case"
        >
          {stats?.responseTimes ? (
            <div className="space-y-2.5">
              {['p50', 'p95', 'p99'].map(k => (
                <div key={k} className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-muted uppercase tracking-widest">{k}</span>
                  <span className="font-semibold text-primary font-mono text-sm">{stats.responseTimes[k]}ms</span>
                </div>
              ))}
            </div>
          ) : <p className="text-muted text-sm">No data</p>}
        </Tile>

        <Tile
          title="Request Status (1h)"
          description="Proportion of successful (2xx) vs client (4xx) and server (5xx) errors in the last hour"
        >
          {requestStatus ? (
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">2xx Success</span>
                <span className="font-semibold font-mono text-success text-sm">
                  {requestStatus.pct2xx !== null ? `${requestStatus.pct2xx}%` : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">4xx Client errors</span>
                <span className="font-semibold font-mono text-warning text-sm">{requestStatus.rate4xx?.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">5xx Server errors</span>
                <span className="font-semibold font-mono text-error text-sm">{requestStatus.rate5xx?.toFixed(1)}%</span>
              </div>
              <div className="mt-2 pt-2 border-t border-border-col flex justify-between items-center">
                <span className="text-xs text-muted">Total requests</span>
                <span className="font-mono text-sm text-secondary">{requestStatus.total}</span>
              </div>
            </div>
          ) : <p className="text-muted text-sm">No data</p>}
        </Tile>

        <Tile
          title="Live Event Stream"
          description="Real-time server-sent events — updates every time a quiz session reports stats"
          wide
        >
          <div className="font-mono text-xs bg-[#080D1A] text-[#4F70FF] rounded-lg p-3 h-36 overflow-y-auto">
            {liveEvents.length === 0 && <span className="text-[#4D637A]">Waiting for events…</span>}
            {liveEvents.map((e, i) => (
              <div key={i}>[{e.time}] stats update — sessions: {e.activeSessions?.last5min ?? 0}</div>
            ))}
          </div>
        </Tile>

      </main>
    </div>
  )
}
