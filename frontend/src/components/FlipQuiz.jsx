import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import FlipCard from './FlipCard.jsx'
import AnswerInput from './AnswerInput.jsx'
import FeedbackBanner from './FeedbackBanner.jsx'
import ScoreBar from './ScoreBar.jsx'
import SessionTimer from './SessionTimer.jsx'
import QuestionTimer from './QuestionTimer.jsx'
import { useQuizSession } from '../hooks/useQuizSession.js'
import { useCountdownTimer } from '../hooks/useCountdownTimer.js'
import { api } from '../api/client.js'
import { getDifficultySettings, difficultyFilter } from '../utils/difficultySettings.js'
import { getGameplaySettings } from '../utils/gameplaySettings.js'

export default function FlipQuiz({ mode, accentColor, renderFront, renderBack, getQuestion, questionKey, filterFn }) {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state || {}
  const region = state.region || 'All'

  const [countries, setCountries] = useState([])
  const [queue, setQueue] = useState([])
  const [queueSize, setQueueSize] = useState(0)
  const [current, setCurrent] = useState(null)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [flashState, setFlashState] = useState(null)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const gpRef = useRef(null)
  const scoreRef = useRef(null)
  const { score, submitAnswer, recordResult, savePersonalBest } = useQuizSession({ mode, region })
  useEffect(() => { scoreRef.current = score }, [score])

  // ── Session countdown timer ─────────────────────────────────────────────────
  const sessionExpiredRef = useRef(false)
  const sessionTimer = useCountdownTimer({
    seconds: 60,
    onExpire: useCallback(() => {
      if (sessionExpiredRef.current) return
      sessionExpiredRef.current = true
      const isNewBest = savePersonalBest()
      navigate('/session-end', { state: { score: scoreRef.current, mode, region, isNewBest } })
    }, [savePersonalBest, navigate, mode, region]),
  })

  // ── Per-question timer ──────────────────────────────────────────────────────
  const advanceRef = useRef(null)
  const currentRef = useRef(null)
  useEffect(() => { currentRef.current = current }, [current])

  const questionTimer = useCountdownTimer({
    seconds: 15,
    onExpire: useCallback(() => {
      const c = currentRef.current
      if (!c) return
      const gp = gpRef.current
      const iso = getQuestion ? getQuestion(c)?.iso : c.isoA2
      recordResult(iso, 'SKIP', null)
      advanceRef.current?.()
    }, [recordResult, getQuestion]),
  })

  // ── Load countries ──────────────────────────────────────────────────────────
  useEffect(() => {
    api.getCountries(region)
      .then(data => {
        const gp = getGameplaySettings()
        gpRef.current = gp

        const { rating, mode: diffMode } = getDifficultySettings()
        const diffFn = difficultyFilter(rating, diffMode)
        const filtered = (filterFn ? data.filter(filterFn) : data).filter(diffFn)
        let shuffled = [...filtered].sort(() => Math.random() - 0.5)

        if (gp.mode === 'maxquestions') {
          shuffled = shuffled.slice(0, Math.min(shuffled.length, gp.maxQuestions))
        }

        setCountries(shuffled)
        setQueueSize(shuffled.length)
        setQueue(shuffled)
        setCurrent(shuffled[0])
        setLoading(false)

        if (gp.mode === 'countdown') {
          sessionTimer.startFrom(gp.countdownSecs)
        }
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [region])

  // ── Per-question timer: reset + start when current changes ─────────────────
  useEffect(() => {
    const gp = gpRef.current
    if (!gp || gp.mode !== 'maxquestions' || !gp.perQuestionTimer) return
    if (!current) return
    questionTimer.startFrom(gp.perQuestionSecs)
  }, [current])

  // ── Advance ─────────────────────────────────────────────────────────────────
  const advance = useCallback(() => {
    setAnswer('')
    setFeedback(null)
    setFlashState(null)
    setFlipped(false)
    questionTimer.stop()
    setQueue(prev => {
      const next = prev.slice(1)
      if (next.length === 0) {
        const isNewBest = savePersonalBest()
        navigate('/session-end', { state: { score, mode, region, isNewBest } })
        return prev
      }
      setCurrent(next[0])
      return next
    })
  }, [score, mode, region, savePersonalBest, navigate, questionTimer])

  useEffect(() => { advanceRef.current = advance }, [advance])

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!answer.trim() || !current || feedback) return
    const question = getQuestion(current)
    const result = await submitAnswer(question.iso, answer)
    setFlashState(result.result === 'CORRECT' ? 'correct' : result.result === 'CLOSE' ? 'close' : 'wrong')
    setFeedback(result)
    if (result.result === 'CORRECT') {
      questionTimer.stop()
      recordResult(question.iso, 'CORRECT', result.canonicalName)
      setFlipped(true)
      setTimeout(advance, 1500)
    }
  }, [answer, current, feedback, getQuestion, submitAnswer, recordResult, advance, questionTimer])

  function handleConfirm() {
    if (!feedback) return
    questionTimer.stop()
    if (feedback.result === 'CLOSE') {
      recordResult(getQuestion(current).iso, 'CORRECT', feedback.canonicalName)
      setFlipped(true)
      setTimeout(advance, 1200)
    } else {
      recordResult(getQuestion(current).iso, 'SKIP', null)
      advance()
    }
  }

  function handleRetry() {
    setFeedback(null)
    setFlashState(null)
    setAnswer('')
  }

  function handleSkip() {
    questionTimer.stop()
    recordResult(getQuestion(current)?.iso, 'SKIP', null)
    advance()
  }

  useEffect(() => {
    function keydown(e) {
      if (e.key === ' ' && !e.target.matches('input')) {
        e.preventDefault()
        setFlipped(f => !f)
      }
    }
    window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  }, [])

  // ── Render ───────────────────────────────────────────────────────────────────
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading countries…</div>
  if (error)   return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>
  if (!current) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
      <p className="text-xl font-semibold text-gray-700">No countries found</p>
      <p className="text-gray-500">The database may still be seeding. Try refreshing in a moment.</p>
      <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Retry</button>
    </div>
  )

  const gp = gpRef.current || { mode: 'none' }
  const showSessionTimer = gp.mode === 'countdown'
  const showQTimer = gp.mode === 'maxquestions' && gp.perQuestionTimer
  const qIndex = queueSize - queue.length + 1

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-800">← Home</button>
        <ScoreBar {...score} />
        {showSessionTimer ? (
          <SessionTimer remaining={sessionTimer.remaining} total={gp.countdownSecs} />
        ) : (
          <span className="text-sm text-gray-400">{qIndex}/{queueSize}</span>
        )}
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-8 flex flex-col gap-5">
        {showQTimer && (
          <QuestionTimer remaining={questionTimer.remaining} total={gp.perQuestionSecs} />
        )}

        <FlipCard
          front={renderFront(current)}
          back={renderBack(current)}
          autoFlip={flipped}
          flashState={flashState}
        />

        <AnswerInput
          value={answer}
          onChange={setAnswer}
          onSubmit={handleSubmit}
          onSkip={handleSkip}
          disabled={!!feedback && feedback.result !== 'WRONG' && feedback.result !== 'CLOSE'}
        />

        <FeedbackBanner
          result={feedback?.result}
          hint={feedback?.hint}
          canonicalName={feedback?.canonicalName}
          onConfirm={handleConfirm}
          onRetry={handleRetry}
        />
      </main>
    </div>
  )
}
