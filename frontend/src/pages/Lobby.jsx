import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Copy, Check, Users, Flag, Globe, Landmark } from 'lucide-react'
import { useRoom } from '../contexts/RoomContext.jsx'
import { api } from '../api/client.js'
import { DIFFICULTY_LABELS } from '../utils/difficultySettings.js'

const MODE_META = {
  flags:    { label: 'Flag Finder',  Icon: Flag,     accent: '#1B3FE4' },
  capitals: { label: 'Capital City', Icon: Landmark, accent: '#EA580C' },
  map:      { label: 'World Map',    Icon: Globe,    accent: '#0D9488' },
}

export default function Lobby() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { players, quizMode, region, difficultyRating, difficultyMode, maxQuestions, questionDurationSeconds, responseAttempts, isHost, phase, initRoom, announceJoin, announceLeave, startGame, hostToken, playerId, connected } = useRoom()
  const [copied, setCopied] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const stored = sessionStorage.getItem(`room_${code}`)
    if (!stored) { navigate('/multiplayer'); return }

    const { playerId: pid, hostToken: ht, displayName, isHost: ih } = JSON.parse(stored)

    api.getRoom(code).then(roomData => {
      initRoom({
        roomCode: code,
        playerId: pid,
        displayName,
        isHost: ih,
        hostToken: ht || null,
        quizMode: roomData.quizMode,
        region: roomData.region,
        difficultyRating: roomData.difficultyRating ?? 5,
        difficultyMode: roomData.difficultyMode ?? 'inclusive',
        maxQuestions: roomData.maxQuestions ?? 15,
        questionDurationSeconds: roomData.questionDurationSeconds ?? 20,
        responseAttempts: roomData.responseAttempts ?? 'unlimited',
      })

      // Seed initial player list from REST
      // players come from room WS events after this point
    }).catch(() => navigate('/multiplayer'))
  }, [code]) // eslint-disable-line

  // Announce presence once connected
  useEffect(() => {
    if (connected && playerId && code) {
      const stored = sessionStorage.getItem(`room_${code}`)
      if (!stored) return
      const { displayName } = JSON.parse(stored)
      announceJoin(code, playerId, displayName)
    }
  }, [connected, playerId, code]) // eslint-disable-line

  // Navigate to game when it starts
  useEffect(() => {
    if (phase === 'QUESTION') {
      navigate(`/game/${code}`, { replace: true })
    }
  }, [phase]) // eslint-disable-line

  useEffect(() => {
    return () => {
      if (playerId && code) announceLeave(code, playerId)
    }
  }, []) // eslint-disable-line

  function copyCode() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleStart() {
    const stored = sessionStorage.getItem(`room_${code}`)
    const parsed = stored ? JSON.parse(stored) : {}
    const ht = parsed.hostToken
    console.log('[Lobby] handleStart', { code, stored: parsed, ht })
    if (!ht) { setError('Host token missing — try rejoining the room.'); return }
    setStarting(true)
    setError(null)
    startGame(code, ht)
  }

  const meta = MODE_META[quizMode] || { label: quizMode, Icon: Globe, accent: '#7C3AED' }
  const { Icon } = meta

  return (
    <div className="min-h-screen bg-base px-6 py-8 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs text-muted uppercase tracking-widest font-medium mb-1">Room code</p>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-primary tracking-[0.2em] font-mono">{code}</span>
            <button
              onClick={copyCode}
              className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-subtle transition-colors"
              title="Copy code"
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            </button>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: `${meta.accent}18`, color: meta.accent }}>
            <Icon size={13} strokeWidth={2} /> {meta.label}
          </span>
          <span className="text-xs text-muted">{region}</span>
          {difficultyRating && (
            <span className="text-xs text-muted">
              {DIFFICULTY_LABELS[difficultyRating - 1]}{difficultyMode === 'exact' ? ' only' : ' & below'} · {maxQuestions}Q · {questionDurationSeconds}s · {responseAttempts === 'unlimited' ? '∞ attempts' : '1 attempt'}
            </span>
          )}
        </div>
      </div>

      {/* Players */}
      <div className="bg-surface border border-border-col rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Users size={16} strokeWidth={1.5} className="text-muted" />
          <span className="text-sm font-semibold text-primary">{players.length} {players.length === 1 ? 'player' : 'players'} in lobby</span>
        </div>

        {players.length === 0 ? (
          <p className="text-sm text-muted text-center py-4">Waiting for players to join…</p>
        ) : (
          <div className="flex flex-col gap-2">
            {players.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 py-1.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: '#7C3AED' }}>
                  {p.displayName.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-primary font-medium">{p.displayName}</span>
                {i === 0 && <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">HOST</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Connection status */}
      {!connected && (
        <div className="flex items-center gap-2 text-sm text-warning mb-4">
          <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
          Connecting to server…
        </div>
      )}

      {error && <p className="text-sm text-error mb-4">{error}</p>}

      {isHost ? (
        <button
          onClick={handleStart}
          disabled={starting || players.length < 1 || !connected}
          className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
          style={{ backgroundColor: '#7C3AED' }}
        >
          {starting ? 'Starting…' : 'Start Game →'}
        </button>
      ) : (
        <div className="flex items-center gap-2 text-sm text-muted">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          Waiting for the host to start the game…
        </div>
      )}

      <p className="text-center text-xs text-muted mt-6">Share the room code with friends to invite them</p>
    </div>
  )
}
