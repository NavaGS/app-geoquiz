import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Flag, Globe, Landmark } from 'lucide-react'
import { api } from '../api/client.js'

const MODES = [
  { id: 'flags',    label: 'Flag Finder',   description: 'Identify countries by flag',    Icon: Flag,     accent: '#1B3FE4' },
  { id: 'capitals', label: 'Capital City',  description: 'Name the capital city',          Icon: Landmark, accent: '#EA580C' },
  { id: 'map',      label: 'World Map',     description: 'Find the highlighted country',   Icon: Globe,    accent: '#0D9488' },
]

const REGIONS = ['All', 'Africa', 'Americas', 'Asia', 'Europe', 'Oceania']

export default function CreateRoom() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('flags')
  const [region, setRegion] = useState('All')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleCreate(e) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    try {
      const { roomCode, playerId, hostToken } = await api.createRoom({
        quizMode: mode,
        region,
        hostDisplayName: name.trim(),
      })
      sessionStorage.setItem(`room_${roomCode}`, JSON.stringify({ playerId, hostToken, displayName: name.trim(), isHost: true }))
      navigate(`/room/${roomCode}`)
    } catch {
      setError('Could not create room. Is the server running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-base px-6 py-8 max-w-lg mx-auto">
      <button
        onClick={() => navigate('/multiplayer')}
        className="flex items-center gap-1 text-sm text-muted hover:text-primary transition-colors mb-6"
      >
        <ChevronLeft size={16} /> Back
      </button>

      <h1 className="text-xl font-bold text-primary mb-1">Create a Room</h1>
      <p className="text-sm text-muted mb-6">Pick a mode and share the code — fine-tune settings once you're in the lobby</p>

      <form onSubmit={handleCreate} className="flex flex-col gap-6">
        <div>
          <label className="block text-xs font-semibold text-secondary uppercase tracking-wide mb-2">Your name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter your display name"
            maxLength={20}
            required
            className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border-col text-primary text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-secondary uppercase tracking-wide mb-2">Quiz mode</label>
          <div className="flex flex-col gap-2">
            {MODES.map(m => {
              const { Icon } = m
              const selected = mode === m.id
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                    selected ? 'border-2' : 'border-border-col bg-surface hover:bg-subtle'
                  }`}
                  style={selected ? { borderColor: m.accent, backgroundColor: `${m.accent}10` } : {}}
                >
                  <Icon size={18} strokeWidth={1.5} style={{ color: m.accent }} />
                  <div>
                    <p className="text-sm font-semibold text-primary">{m.label}</p>
                    <p className="text-xs text-muted">{m.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-secondary uppercase tracking-wide mb-2">Region</label>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRegion(r)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  region === r
                    ? 'bg-accent text-white border-accent'
                    : 'bg-surface border-border-col text-secondary hover:text-primary'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-error">{error}</p>}

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
          style={{ backgroundColor: '#7C3AED' }}
        >
          {loading ? 'Creating…' : 'Create Room →'}
        </button>
      </form>
    </div>
  )
}
