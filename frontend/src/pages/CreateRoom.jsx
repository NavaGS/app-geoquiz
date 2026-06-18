import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Flag, Globe, Landmark } from 'lucide-react'
import { api } from '../api/client.js'
import { getDifficultySettings, DIFFICULTY_LABELS } from '../utils/difficultySettings.js'

const MODES = [
  { id: 'flags',    label: 'Flag Finder',   description: 'Identify countries by flag', Icon: Flag,     accent: '#1B3FE4' },
  { id: 'capitals', label: 'Capital City',  description: 'Name the capital city',      Icon: Landmark, accent: '#EA580C' },
  { id: 'map',      label: 'World Map',     description: 'Find the highlighted country', Icon: Globe,   accent: '#0D9488' },
]

const REGIONS = ['All', 'Africa', 'Americas', 'Asia', 'Europe', 'Oceania']
const QUESTION_COUNTS = [5, 10, 15, 20]
const TIME_LIMITS = [5, 10, 15]

export default function CreateRoom() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('flags')
  const [region, setRegion] = useState('All')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const savedDiff = getDifficultySettings()
  const [difficultyRating, setDifficultyRating] = useState(savedDiff.rating)
  const [difficultyMode, setDifficultyMode] = useState(savedDiff.mode)
  const [maxQuestions, setMaxQuestions] = useState(15)
  const [questionDurationSeconds, setQuestionDurationSeconds] = useState(20)
  const [responseAttempts, setResponseAttempts] = useState('unlimited')

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
        difficultyRating,
        difficultyMode,
        maxQuestions,
        questionDurationSeconds,
        responseAttempts,
      })
      sessionStorage.setItem(`room_${roomCode}`, JSON.stringify({ playerId, hostToken, displayName: name.trim(), isHost: true }))
      navigate(`/room/${roomCode}`)
    } catch (err) {
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
      <p className="text-sm text-muted mb-6">Choose a quiz mode and share the code with friends</p>

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

        <div>
          <label className="block text-xs font-semibold text-secondary uppercase tracking-wide mb-2">
            Difficulty — <span className="text-primary normal-case font-medium">{DIFFICULTY_LABELS[difficultyRating - 1]}</span>
          </label>
          <input
            type="range"
            min={1} max={5} step={1}
            value={difficultyRating}
            onChange={e => setDifficultyRating(Number(e.target.value))}
            className="w-full accent-[#7C3AED]"
          />
          <div className="flex justify-between text-[10px] text-muted mt-1">
            <span>Very Easy</span><span>Very Hard</span>
          </div>
          <div className="flex gap-2 mt-2">
            {['inclusive', 'exact'].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setDifficultyMode(m)}
                className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                  difficultyMode === m
                    ? 'bg-accent text-white border-accent'
                    : 'bg-surface border-border-col text-secondary hover:text-primary'
                }`}
              >
                {m === 'inclusive' ? `Up to ${DIFFICULTY_LABELS[difficultyRating - 1]}` : `Only ${DIFFICULTY_LABELS[difficultyRating - 1]}`}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-secondary uppercase tracking-wide mb-2">Questions</label>
          <div className="flex gap-2">
            {QUESTION_COUNTS.map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setMaxQuestions(n)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all ${
                  maxQuestions === n
                    ? 'bg-accent text-white border-accent'
                    : 'bg-surface border-border-col text-secondary hover:text-primary'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-secondary uppercase tracking-wide mb-2">Time per question</label>
          <div className="flex gap-2">
            {TIME_LIMITS.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setQuestionDurationSeconds(s)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all ${
                  questionDurationSeconds === s
                    ? 'bg-accent text-white border-accent'
                    : 'bg-surface border-border-col text-secondary hover:text-primary'
                }`}
              >
                {s}s
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-secondary uppercase tracking-wide mb-2">Response attempts</label>
          <div className="flex gap-2">
            {[['unlimited', 'Unlimited'], ['single', 'Single']].map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setResponseAttempts(val)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all ${
                  responseAttempts === val
                    ? 'bg-accent text-white border-accent'
                    : 'bg-surface border-border-col text-secondary hover:text-primary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted mt-1.5">
            {responseAttempts === 'unlimited'
              ? 'Players can keep trying until the timer runs out'
              : 'Players get one submission per question'}
          </p>
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
