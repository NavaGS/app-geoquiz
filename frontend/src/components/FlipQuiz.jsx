import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import FlipCard from './FlipCard.jsx'
import AnswerInput from './AnswerInput.jsx'
import FeedbackBanner from './FeedbackBanner.jsx'
import QuizHeader from './QuizHeader.jsx'
import QuestionTimer from './QuestionTimer.jsx'
import { useQuizSession } from '../hooks/useQuizSession.js'
import { useCountdownTimer } from '../hooks/useCountdownTimer.js'
import { api } from '../api/client.js'
import { getDifficultySettings, difficultyFilter } from '../utils/difficultySettings.js'
import { getGameplaySettings } from '../utils/gameplaySettings.js'
import { getRegion } from '../utils/regionSettings.js'
import { getAnonymousUserId } from '../utils/anonymousUser.js'

export default function FlipQuiz({ mode, evalMode, accentColor, renderFront, renderBack, getQuestion, getCanonical, questionKey, filterFn, modeName, modeLabel }) {
  const navigate = useNavigate()
  const region = getRegion()
  const userId = getAnonymousUserId()

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

  const inputRef = useRef()
  const gpRef = useRef(null)
  const scoreRef = useRef(null)
  const { score, submitAnswer, recordResult, savePersonalBest, historyRef, sessionId } = useQuizSession({ mode, evalMode, region })
  useEffect(() => { scoreRef.current = score }, [score])

  // ── Per-question guards (fix 1.1 + 1.2) ─────────────────────────────────────
  const questionSettledRef = useRef(false) // prevents double-record per question
  const questionGenRef = useRef(0)         // invalidates stale advance callbacks
  const submittingRef = useRef(false)      // in-flight API call guard

  // ── Session countdown timer ─────────────────────────────────────────────────
  const sessionExpiredRef = useRef(false)
  const sessionTimer = useCountdownTimer({
    seconds: 60,
    onExpire: useCallback(() => {
      if (sessionExpiredRef.current) return
      sessionExpiredRef.current = true
      const c = currentRef.current
      const last = historyRef.current[historyRef.current.length - 1]
      const currentISO = c ? (getQuestion ? getQuestion(c)?.iso : c.isoA2) : null
      const unanswered = currentISO && (!last || last.countryIso !== currentISO)
      if (unanswered) recordResult(currentISO, 'SKIP', getCanonical ? getCanonical(c) : null, null, null)
      const isNewBest = savePersonalBest()
      const sessionScore = unanswered ? { ...scoreRef.current, skipped: scoreRef.current.skipped + 1 } : scoreRef.current
      const total = sessionScore.correct + sessionScore.wrong + sessionScore.skipped
      api.logEvent({
        sessionId,
        userId,
        mode,
        regionFilter: region,
        eventType: 'quiz_complete',
        answerGiven: `${sessionScore.correct}/${total}`,
        similarityScore: total > 0 ? sessionScore.correct / total : 0,
      }).catch(() => {})
      navigate('/session-end', { state: { score: sessionScore, mode, region, isNewBest, results: historyRef.current } })
    }, [savePersonalBest, navigate, mode, region, getQuestion, getCanonical, recordResult]),
  })

  // ── Per-question timer ──────────────────────────────────────────────────────
  const advanceRef = useRef(null)
  const currentRef = useRef(null)
  const flippedRef = useRef(false)
  useEffect(() => { currentRef.current = current }, [current])
  useEffect(() => { flippedRef.current = flipped }, [flipped])

  const questionTimer = useCountdownTimer({
    seconds: 15,
    onExpire: useCallback(() => {
      const c = currentRef.current
      if (!c) return
      const gen = questionGenRef.current
      const iso = getQuestion ? getQuestion(c)?.iso : c.isoA2
      if (!questionSettledRef.current) {
        questionSettledRef.current = true
        recordResult(iso, 'SKIP', getCanonical ? getCanonical(c) : null, null, null)
      }
      setTimeout(() => {
        if (questionGenRef.current !== gen) return
        setFlipped(true)
        setTimeout(() => {
          if (questionGenRef.current !== gen) return
          advanceRef.current?.()
        }, 2000)
      }, 1000)
    }, [recordResult, getQuestion, getCanonical]),
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

        api.logEvent({ sessionId, userId, mode, regionFilter: region, eventType: 'session_start' }).catch(() => {})

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
    // Reset per-question guards so the next question starts clean
    questionSettledRef.current = false
    submittingRef.current = false
    questionGenRef.current += 1

    setAnswer('')
    setFeedback(null)
    setFlashState(null)
    questionTimer.stop()
    const wasFlipped = flippedRef.current
    setFlipped(false)
    const updateQueue = () => setQueue(prev => {
      const next = prev.slice(1)
      if (next.length === 0) {
        const isNewBest = savePersonalBest()
        const s = scoreRef.current
        const total = s.correct + s.wrong + s.skipped
        api.logEvent({
          sessionId,
          userId,
          mode,
          regionFilter: region,
          eventType: 'quiz_complete',
          answerGiven: `${s.correct}/${total}`,
          similarityScore: total > 0 ? s.correct / total : 0,
        }).catch(() => {})
        navigate('/session-end', { state: { score: s, mode, region, isNewBest, results: historyRef.current } })
        return prev
      }
      setCurrent(next[0])
      return next
    })
    if (wasFlipped) {
      setTimeout(updateQueue, 400)
    } else {
      updateQueue()
    }
  }, [mode, region, savePersonalBest, navigate, questionTimer])

  useEffect(() => { advanceRef.current = advance }, [advance])

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!answer.trim() || !current || feedback) return
    if (submittingRef.current) return
    submittingRef.current = true
    const question = getQuestion(current)
    const result = await submitAnswer(question.iso, answer)
    if (result.result === 'CORRECT') {
      setFlashState('correct')
      setFeedback(result)
      questionTimer.stop()
      if (!questionSettledRef.current) {
        questionSettledRef.current = true
        recordResult(question.iso, 'CORRECT', result.canonicalName, answer, null)
      }
      setFlipped(true)
      setTimeout(() => advanceRef.current?.(), 700)
    } else if (result.result === 'CLOSE') {
      submittingRef.current = false
      questionTimer.stop()
      setFlashState('close')
      setFeedback(result)
    } else {
      submittingRef.current = false
      setAnswer('')
      setFlashState('wrong')
      setFeedback(null)
      setTimeout(() => { setFlashState(null); inputRef.current?.focus() }, 700)
    }
  }, [answer, current, feedback, getQuestion, submitAnswer, recordResult, questionTimer])

  function handleConfirm() {
    if (!feedback) return
    questionTimer.stop()
    if (feedback.result === 'CLOSE') {
      if (!questionSettledRef.current) {
        questionSettledRef.current = true
        recordResult(getQuestion(current).iso, 'CORRECT', feedback.canonicalName, answer, null)
      }
      setFlipped(true)
      setTimeout(() => advanceRef.current?.(), 700)
    } else {
      if (!questionSettledRef.current) {
        questionSettledRef.current = true
        recordResult(getQuestion(current).iso, 'SKIP', getCanonical ? getCanonical(current) : null, null, null)
      }
      advanceRef.current?.()
    }
  }

  function handleRetry() {
    setFeedback(null)
    setFlashState(null)
    setAnswer('')
    inputRef.current?.focus()
  }

  function handleSkip() {
    questionTimer.stop()
    if (!questionSettledRef.current) {
      questionSettledRef.current = true
      recordResult(getQuestion(current)?.iso, 'SKIP', getCanonical ? getCanonical(current) : null, null, null)
    }
    setFlipped(true)
    setTimeout(() => advanceRef.current?.(), 2000)
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

  const frontContent = useMemo(() => current ? renderFront(current) : null, [current, renderFront])
  const backContent  = useMemo(() => current ? renderBack(current)  : null, [current, renderBack])

  // ── Render ───────────────────────────────────────────────────────────────────
  if (loading) return <div className="min-h-screen bg-base flex items-center justify-center text-muted">Loading countries…</div>
  if (error)   return <div className="min-h-screen bg-base flex items-center justify-center text-error">{error}</div>
  if (!current) return (
    <div className="min-h-screen bg-base flex flex-col items-center justify-center gap-4 text-center px-4">
      <p className="text-xl font-semibold text-primary">No countries found</p>
      <p className="text-secondary">The database may still be seeding. Try refreshing in a moment.</p>
      <button onClick={() => window.location.reload()} className="px-4 py-2 bg-accent text-white rounded-lg hover:opacity-90">Retry</button>
    </div>
  )

  const gp = gpRef.current || { mode: 'none' }
  const showSessionTimer = gp.mode === 'countdown'
  const showQTimer = gp.mode === 'maxquestions' && gp.perQuestionTimer
  const qIndex = queueSize - queue.length + 1

  return (
    <div className="min-h-screen bg-base flex flex-col">
      <QuizHeader
        modeName={modeName || mode}
        region={region}
        score={score}
        sessionTimer={sessionTimer}
        gp={gp}
        qIndex={qIndex}
        total={queueSize}
      />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-8 flex flex-col gap-5">
        {showQTimer && (
          <QuestionTimer remaining={questionTimer.remaining} total={gp.perQuestionSecs} startKey={qIndex} />
        )}

        <FlipCard
          front={frontContent}
          back={backContent}
          autoFlip={flipped}
          flashState={flashState}
        />

        <AnswerInput
          ref={inputRef}
          value={answer}
          onChange={setAnswer}
          onSubmit={handleSubmit}
          onSkip={handleSkip}
          disabled={!!feedback && feedback.result === 'CORRECT'}
          flash={flashState}
          focusKey={qIndex}
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
