import { useState, useEffect, useRef } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { api, SSE_URL } from '../api/client.js'

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

  return (
    <div className="min-h-screen bg-base">
      {error && <div className="m-4 bg-error/10 text-error border border-error px-4 py-3 rounded-lg text-sm">{error}</div>}

      <div className="flex justify-end px-4 pt-4">
        <button onClick={loadStats} className="text-sm text-accent hover:opacity-80">Refresh</button>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-4 grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

        {/* Active Sessions */}
        <div className="bg-surface border border-border-col rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-primary text-sm mb-3">Active Sessions</h2>
          {stats ? (
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: '5 min', val: stats.activeSessions?.last5min },
                { label: '30 min', val: stats.activeSessions?.last30min },
                { label: '60 min', val: stats.activeSessions?.last60min },
              ].map(({ label, val }) => (
                <div key={label} className="bg-subtle rounded-lg py-3">
                  <p className="text-2xl font-bold text-accent">{val ?? '—'}</p>
                  <p className="text-xs text-muted">{label}</p>
                </div>
              ))}
            </div>
          ) : <p className="text-muted text-sm">Loading…</p>}
        </div>

        {/* Mode Popularity */}
        <div className="bg-surface border border-border-col rounded-xl shadow-sm p-5 col-span-1 md:col-span-2">
          <h2 className="font-semibold text-primary text-sm mb-3">Mode Popularity</h2>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={modePop}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="mode" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }} />
              <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Accuracy by Mode */}
        <div className="bg-surface border border-border-col rounded-xl shadow-sm p-5 col-span-1 md:col-span-2">
          <h2 className="font-semibold text-primary text-sm mb-3">Answer Accuracy by Mode (%)</h2>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={modeAcc}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="mode" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }} formatter={(v) => `${v}%`} />
              <Bar dataKey="accuracy" fill="var(--success)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Response Times */}
        <div className="bg-surface border border-border-col rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-primary text-sm mb-3">Response Times (ms)</h2>
          {stats?.responseTimes ? (
            <div className="space-y-2">
              {['p50', 'p95', 'p99'].map(k => (
                <div key={k} className="flex justify-between">
                  <span className="text-sm text-muted uppercase">{k}</span>
                  <span className="font-semibold text-primary font-mono">{stats.responseTimes[k]}ms</span>
                </div>
              ))}
            </div>
          ) : <p className="text-muted text-sm">No data</p>}
        </div>

        {/* Error Rates */}
        <div className="bg-surface border border-border-col rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-primary text-sm mb-3">Error Rates (1h)</h2>
          {stats?.errorRates ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted">4xx</span>
                <span className="font-semibold text-warning font-mono">{stats.errorRates.rate4xx?.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted">5xx</span>
                <span className="font-semibold text-error font-mono">{stats.errorRates.rate5xx?.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted">Total requests</span>
                <span className="font-semibold text-primary font-mono">{stats.errorRates.total}</span>
              </div>
            </div>
          ) : <p className="text-muted text-sm">No data</p>}
        </div>

        {/* Hardest Countries */}
        <div className="bg-surface border border-border-col rounded-xl shadow-sm p-5 col-span-1 md:col-span-2 lg:col-span-3">
          <h2 className="font-semibold text-primary text-sm mb-3">Hardest Countries (Top 10)</h2>
          {stats?.hardestCountries?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-border-col">
                    <th className="py-2 pr-4 text-muted text-xs uppercase tracking-widest">#</th>
                    <th className="py-2 pr-4 text-muted text-xs uppercase tracking-widest">Country ISO</th>
                    <th className="py-2 pr-4 text-muted text-xs uppercase tracking-widest">Total</th>
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
                      <td className="py-2 text-error">{c.accuracy?.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-muted text-sm">No data yet</p>}
        </div>

        {/* Live Event Feed */}
        <div className="bg-surface border border-border-col rounded-xl shadow-sm p-5 col-span-1 md:col-span-2 lg:col-span-3">
          <h2 className="font-semibold text-primary text-sm mb-3">Live Event Feed (SSE)</h2>
          <div className="font-mono text-xs bg-[#080D1A] text-[#4F70FF] rounded-lg p-3 h-40 overflow-y-auto">
            {liveEvents.length === 0 && <p className="text-muted">Waiting for events…</p>}
            {liveEvents.map((e, i) => (
              <div key={i}>[{e.time}] stats update — sessions: {e.activeSessions?.last5min ?? 0}</div>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}
