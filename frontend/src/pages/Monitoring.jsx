import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { api, SSE_URL } from '../api/client.js'

export default function Monitoring() {
  const navigate = useNavigate()
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

    // SSE
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4">
        <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-800">← Home</button>
        <h1 className="font-bold text-gray-800 text-lg">Monitoring Dashboard</h1>
        <button onClick={loadStats} className="ml-auto text-sm text-blue-500 hover:underline">Refresh</button>
      </header>

      {error && <div className="m-4 bg-red-100 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

      <main className="max-w-5xl mx-auto px-4 py-6 grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

        {/* Active Sessions */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-700 mb-3">Active Sessions</h2>
          {stats ? (
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: '5 min', val: stats.activeSessions?.last5min },
                { label: '30 min', val: stats.activeSessions?.last30min },
                { label: '60 min', val: stats.activeSessions?.last60min },
              ].map(({ label, val }) => (
                <div key={label} className="bg-gray-50 rounded-lg py-3">
                  <p className="text-2xl font-bold text-blue-600">{val ?? '—'}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm">Loading…</p>}
        </div>

        {/* Mode Popularity */}
        <div className="bg-white rounded-2xl shadow-sm p-5 col-span-1 md:col-span-2">
          <h2 className="font-semibold text-gray-700 mb-3">Mode Popularity</h2>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={modePop}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mode" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Accuracy by Mode */}
        <div className="bg-white rounded-2xl shadow-sm p-5 col-span-1 md:col-span-2">
          <h2 className="font-semibold text-gray-700 mb-3">Answer Accuracy by Mode (%)</h2>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={modeAcc}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mode" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="accuracy" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Response Times */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-700 mb-3">Response Times (ms)</h2>
          {stats?.responseTimes ? (
            <div className="space-y-2">
              {['p50', 'p95', 'p99'].map(k => (
                <div key={k} className="flex justify-between">
                  <span className="text-sm text-gray-500 uppercase">{k}</span>
                  <span className="font-semibold text-gray-700">{stats.responseTimes[k]}ms</span>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm">No data</p>}
        </div>

        {/* Error Rates */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-700 mb-3">Error Rates (1h)</h2>
          {stats?.errorRates ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">4xx</span>
                <span className="font-semibold text-amber-600">{stats.errorRates.rate4xx?.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">5xx</span>
                <span className="font-semibold text-red-600">{stats.errorRates.rate5xx?.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total requests</span>
                <span className="font-semibold">{stats.errorRates.total}</span>
              </div>
            </div>
          ) : <p className="text-gray-400 text-sm">No data</p>}
        </div>

        {/* Hardest Countries */}
        <div className="bg-white rounded-2xl shadow-sm p-5 col-span-1 md:col-span-2 lg:col-span-3">
          <h2 className="font-semibold text-gray-700 mb-3">Hardest Countries (Top 10)</h2>
          {stats?.hardestCountries?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2 pr-4">#</th>
                    <th className="py-2 pr-4">Country ISO</th>
                    <th className="py-2 pr-4">Total Attempts</th>
                    <th className="py-2 pr-4">Correct</th>
                    <th className="py-2">Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.hardestCountries.map((c, i) => (
                    <tr key={c.iso} className="border-b last:border-0">
                      <td className="py-2 pr-4 text-gray-400">{i + 1}</td>
                      <td className="py-2 pr-4 font-mono font-semibold">{c.iso}</td>
                      <td className="py-2 pr-4">{c.total}</td>
                      <td className="py-2 pr-4 text-green-600">{c.correct}</td>
                      <td className="py-2 text-red-500">{c.accuracy?.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-gray-400 text-sm">No data yet</p>}
        </div>

        {/* Live Event Feed */}
        <div className="bg-white rounded-2xl shadow-sm p-5 col-span-1 md:col-span-2 lg:col-span-3">
          <h2 className="font-semibold text-gray-700 mb-3">Live Event Feed (SSE)</h2>
          <div className="font-mono text-xs bg-gray-900 text-green-400 rounded-lg p-3 h-40 overflow-y-auto">
            {liveEvents.length === 0 && <p className="text-gray-500">Waiting for events…</p>}
            {liveEvents.map((e, i) => (
              <div key={i}>[{e.time}] stats update — sessions: {e.activeSessions?.last5min ?? 0}</div>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}
