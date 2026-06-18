import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { api } from '../api/client.js'

export default function JoinRoom() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const codeRef = useRef()

  function handleCodeChange(e) {
    setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))
  }

  async function handleJoin(e) {
    e.preventDefault()
    if (code.length !== 6 || !name.trim()) return
    setLoading(true)
    setError(null)
    try {
      const { playerId } = await api.joinRoomRest(code, name.trim())
      sessionStorage.setItem(`room_${code}`, JSON.stringify({ playerId, isHost: false, displayName: name.trim() }))
      navigate(`/room/${code}`)
    } catch (err) {
      const msg = err.message || ''
      if (msg.includes('400')) setError('Game already in progress or room is full.')
      else if (msg.includes('404')) setError('Room not found. Check the code and try again.')
      else setError('Could not join room. Is the server running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-base px-6 py-8 max-w-sm mx-auto">
      <button
        onClick={() => navigate('/multiplayer')}
        className="flex items-center gap-1 text-sm text-muted hover:text-primary transition-colors mb-6"
      >
        <ChevronLeft size={16} /> Back
      </button>

      <h1 className="text-xl font-bold text-primary mb-1">Join a Room</h1>
      <p className="text-sm text-muted mb-6">Enter the 6-character room code from your host</p>

      <form onSubmit={handleJoin} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-semibold text-secondary uppercase tracking-wide mb-2">Room code</label>
          <input
            ref={codeRef}
            type="text"
            value={code}
            onChange={handleCodeChange}
            placeholder="e.g. P7K9QX"
            maxLength={6}
            required
            autoFocus
            className="w-full px-3 py-3 rounded-lg bg-surface border border-border-col text-primary text-lg font-mono tracking-[0.3em] text-center placeholder:text-muted placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>

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

        {error && <p className="text-sm text-error">{error}</p>}

        <button
          type="submit"
          disabled={loading || code.length !== 6 || !name.trim()}
          className="w-full rounded-xl py-3 text-sm font-semibold text-white mt-2 transition-opacity disabled:opacity-50"
          style={{ backgroundColor: '#7C3AED' }}
        >
          {loading ? 'Joining…' : 'Join Room →'}
        </button>
      </form>
    </div>
  )
}
