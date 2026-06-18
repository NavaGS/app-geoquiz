import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as d3 from 'd3'
import { useRoom } from '../contexts/RoomContext.jsx'
import { useTheme } from '../contexts/ThemeContext.jsx'
import { api } from '../api/client.js'

// ── Timer hook synced to server start time ────────────────────────────────────
function useServerTimer(serverStartTimeMs, durationSeconds) {
  const [timeLeft, setTimeLeft] = useState(durationSeconds)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!serverStartTimeMs) return
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - serverStartTimeMs) / 1000
      const remaining = Math.max(0, durationSeconds - elapsed)
      setTimeLeft(remaining)
      if (remaining <= 0) clearInterval(intervalRef.current)
    }, 100)
    return () => clearInterval(intervalRef.current)
  }, [serverStartTimeMs, durationSeconds])

  return timeLeft
}

// ── Map renderer for map mode ─────────────────────────────────────────────────
function MapView({ isoA2, theme }) {
  const svgRef = useRef()
  const [geojson, setGeojson] = useState(null)

  const colors = theme === 'dark'
    ? { water: '#0A1628', country: '#1A2744', highlight: '#4F70FF', stroke: '#6B87FF' }
    : { water: '#C8D8EC', country: '#E4E9F0', highlight: '#60A5FA', stroke: '#1B3FE4' }

  useEffect(() => {
    api.getWorldGeoJson('All').then(setGeojson).catch(() => {})
  }, [])

  useEffect(() => {
    if (!geojson || !svgRef.current) return
    const w = svgRef.current.clientWidth || 500
    const h = 280
    const svg = d3.select(svgRef.current)
    svg.attr('viewBox', `0 0 ${w} ${h}`)

    const proj = d3.geoNaturalEarth1().scale(w / 6).translate([w / 2, h / 2])
    const path = d3.geoPath().projection(proj)

    svg.selectAll('*').remove()
    svg.append('rect').attr('width', w).attr('height', h).attr('fill', colors.water)
    svg.selectAll('path')
      .data(geojson.features)
      .join('path')
      .attr('d', path)
      .attr('fill', f => f.properties.isoA2 === isoA2 ? colors.highlight : colors.country)
      .attr('stroke', f => f.properties.isoA2 === isoA2 ? colors.stroke : colors.water)
      .attr('stroke-width', f => f.properties.isoA2 === isoA2 ? 1.5 : 0.4)
  }, [geojson, isoA2, colors.water, colors.country, colors.highlight, colors.stroke])

  return (
    <div className="w-full rounded-xl overflow-hidden border border-border-col">
      <svg ref={svgRef} className="w-full" style={{ height: 280 }} />
    </div>
  )
}

// ── Timer bar ─────────────────────────────────────────────────────────────────
function TimerBar({ timeLeft, total }) {
  const pct = Math.max(0, Math.min(1, timeLeft / total))
  const color = pct > 0.5 ? '#059669' : pct > 0.25 ? '#D97706' : '#DC2626'
  return (
    <div className="w-full h-1.5 bg-subtle rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-100"
        style={{ width: `${pct * 100}%`, backgroundColor: color }}
      />
    </div>
  )
}

// ── Leaderboard overlay ───────────────────────────────────────────────────────
function LeaderboardView({ leaderboard, correctAnswer, currentPlayerId, onNext, isLast }) {
  return (
    <div className="flex flex-col gap-4">
      {correctAnswer && (
        <div className="text-center py-4 bg-surface border border-border-col rounded-xl">
          <p className="text-xs text-muted uppercase tracking-widest mb-1">Correct answer</p>
          <p className="text-2xl font-bold text-primary">{correctAnswer}</p>
        </div>
      )}
      <div className="bg-surface border border-border-col rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border-col">
          <p className="text-sm font-semibold text-primary">Leaderboard</p>
        </div>
        {leaderboard.slice(0, 8).map((entry, i) => {
          const isMe = entry.playerId === currentPlayerId
          return (
            <div
              key={entry.playerId}
              className={`flex items-center gap-3 px-4 py-3 border-b border-border-col last:border-0 ${isMe ? 'bg-accent/5' : ''}`}
            >
              <span className="text-sm font-bold text-muted w-5 text-center">{entry.rank}</span>
              <span className={`text-sm font-medium flex-1 ${isMe ? 'text-accent font-semibold' : 'text-primary'}`}>
                {entry.displayName} {isMe && '(you)'}
              </span>
              <span className="text-sm font-bold text-primary">{entry.score.toLocaleString()}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main game component ───────────────────────────────────────────────────────
export default function MultiplayerGame() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const {
    phase, question, answerResult, leaderboard, finalLeaderboard, correctAnswer,
    playerId, quizMode, initRoom, submitAnswer: ctxSubmit, connected,
  } = useRoom()

  const [answer, setAnswer] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [flashClass, setFlashClass] = useState('')
  const inputRef = useRef()

  const timeLeft = useServerTimer(
    question?.serverStartTimeMs,
    question?.durationSeconds ?? 20
  )

  // Restore session from sessionStorage if context lost (e.g. page refresh)
  useEffect(() => {
    const stored = sessionStorage.getItem(`room_${code}`)
    if (!stored) { navigate('/multiplayer'); return }
    if (!playerId) {
      const { playerId: pid, hostToken, displayName, isHost } = JSON.parse(stored)
      api.getRoom(code).then(roomData => {
        initRoom({ roomCode: code, playerId: pid, displayName, isHost, hostToken: hostToken || null, quizMode: roomData.quizMode, region: roomData.region })
      }).catch(() => navigate('/multiplayer'))
    }
  }, [code]) // eslint-disable-line

  // Reset answer state on new question
  useEffect(() => {
    if (phase === 'QUESTION') {
      setAnswer('')
      setSubmitted(false)
      setFlashClass('')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [phase, question?.questionIndex])

  // Flash feedback when answer result arrives
  useEffect(() => {
    if (answerResult?.correct === true) setFlashClass('flash-correct')
    else if (answerResult?.correct === false) setFlashClass('flash-wrong')
  }, [answerResult])

  function handleSubmit(e) {
    e.preventDefault()
    if (!answer.trim() || submitted || phase !== 'QUESTION') return
    setSubmitted(true)
    ctxSubmit(code, playerId, question.questionIndex, answer.trim())
  }

  if (phase === 'ENDED') {
    return (
      <div className="min-h-screen bg-base px-6 py-10 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-primary text-center mb-2">Game Over!</h1>
        <p className="text-sm text-muted text-center mb-8">Final results</p>
        <LeaderboardView
          leaderboard={finalLeaderboard}
          correctAnswer={null}
          currentPlayerId={playerId}
          isLast
        />
        <button
          onClick={() => navigate('/multiplayer')}
          className="w-full mt-6 rounded-xl py-3 text-sm font-semibold text-white"
          style={{ backgroundColor: '#7C3AED' }}
        >
          Back to Multiplayer
        </button>
      </div>
    )
  }

  if (phase === 'LOBBY' || !question) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted">Game starting…</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-base flex flex-col ${flashClass}`}
      onAnimationEnd={() => setFlashClass('')}>

      {/* Header bar */}
      <div className="bg-surface border-b border-border-col px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <span className="text-xs font-semibold text-muted uppercase tracking-widest">
            {question.questionIndex + 1} / {question.totalQuestions}
          </span>
          <span className="text-sm font-bold text-primary tabular-nums">
            {Math.ceil(timeLeft)}s
          </span>
        </div>
        <div className="max-w-lg mx-auto mt-2">
          <TimerBar timeLeft={timeLeft} total={question.durationSeconds} />
        </div>
      </div>

      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        {/* Question content by mode */}
        {quizMode === 'flags' && (
          <div className="flex flex-col items-center mb-6">
            <p className="text-xs text-muted font-medium uppercase tracking-widest mb-4">
              Which country is this flag?
            </p>
            {question.flagUrl ? (
              <div style={{ width: 260, height: 174 }} className="rounded-xl overflow-hidden border border-border-col shadow-sm">
                <img src={question.flagUrl} alt="flag" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
            ) : (
              <div style={{ width: 260, height: 174 }} className="bg-subtle rounded-xl flex items-center justify-center text-muted text-sm">
                No flag available
              </div>
            )}
          </div>
        )}

        {quizMode === 'capitals' && (
          <div className="flex flex-col items-center mb-6">
            <p className="text-xs text-muted font-medium uppercase tracking-widest mb-4">
              What is the capital of…
            </p>
            <div className="flex flex-col items-center gap-3">
              {question.flagUrl && (
                <div style={{ width: 100, height: 67 }} className="rounded-lg overflow-hidden border border-border-col shadow-sm">
                  <img src={question.flagUrl} alt="flag" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
              )}
              <p className="text-3xl font-bold text-primary tracking-tight text-center">{question.countryName}</p>
            </div>
          </div>
        )}

        {quizMode === 'map' && (
          <div className="mb-6">
            <p className="text-xs text-muted font-medium uppercase tracking-widest mb-4 text-center">
              Which country is highlighted?
            </p>
            <MapView isoA2={question.isoA2} theme={theme} />
          </div>
        )}

        {/* Answer area */}
        {phase === 'RESULTS' ? (
          <LeaderboardView
            leaderboard={leaderboard}
            correctAnswer={correctAnswer}
            currentPlayerId={playerId}
          />
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {submitted ? (
              <div className="flex flex-col items-center gap-3 py-6">
                {answerResult?.correct === true && (
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-lg font-semibold" style={{ color: '#059669' }}>Correct! +{answerResult.points?.toLocaleString()}</p>
                    <p className="text-sm text-muted">{answerResult.canonicalAnswer}</p>
                  </div>
                )}
                {answerResult?.correct === false && (
                  <p className="text-lg font-semibold text-error">Not quite!</p>
                )}
                {answerResult?.correct === null && (
                  <p className="text-sm text-muted animate-pulse">Submitted! Waiting for others…</p>
                )}
                <p className="text-xs text-muted mt-2">Results show when the timer ends</p>
              </div>
            ) : (
              <>
                <input
                  ref={inputRef}
                  type="text"
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  placeholder="Type your answer…"
                  autoComplete="off"
                  className="w-full px-4 py-3 rounded-xl bg-surface border border-border-col text-primary text-base placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
                <button
                  type="submit"
                  disabled={!answer.trim()}
                  className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
                  style={{ backgroundColor: '#7C3AED' }}
                >
                  Submit Answer
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
