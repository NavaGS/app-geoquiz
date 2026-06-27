import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import FlipCard from '../components/FlipCard.jsx'
import AnswerInput from '../components/AnswerInput.jsx'
import FeedbackBanner from '../components/FeedbackBanner.jsx'
import QuizHeader from '../components/QuizHeader.jsx'
import QuestionTimer from '../components/QuestionTimer.jsx'
import { useQuizSession } from '../hooks/useQuizSession.js'
import { useCountdownTimer } from '../hooks/useCountdownTimer.js'
import { api } from '../api/client.js'
import { getDifficultySettings, difficultyFilter } from '../utils/difficultySettings.js'
import { getGameplaySettings } from '../utils/gameplaySettings.js'
import { getRegion } from '../utils/regionSettings.js'

export default function LanguageQuiz() {
  const navigate = useNavigate()
  const region = getRegion()

  const [queue, setQueue] = useState([])
  const [total, setTotal] = useState(0)
  const [current, setCurrent] = useState(null)
  const inputRef = useRef()
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [flashState, setFlashState] = useState(null)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(true)

  const gpRef = useRef(null)
  const scoreRef = useRef(null)
  const { score, recordResult, savePersonalBest, historyRef } = useQuizSession({ mode: 'language', region })
  useEffect(() => { scoreRef.current = score }, [score])

  const sessionExpiredRef = useRef(false)
  const sessionTimer = useCountdownTimer({
    seconds: 60,
    onExpire: () => {
      if (sessionExpiredRef.current) return
      sessionExpiredRef.current = true
      const c = currentRef.current
      const last = historyRef.current[historyRef.current.length - 1]
      const unanswered = c && (!last || last.countryIso !== c.isoA2)
      if (unanswered) recordResult(c.isoA2, 'SKIP', c.nameCommon, null, null)
      const isNewBest = savePersonalBest()
      const sessionScore = unanswered ? { ...scoreRef.current, skipped: scoreRef.current.skipped + 1 } : scoreRef.current
      navigate('/session-end', { state: { score: sessionScore, mode: 'language', region, isNewBest, results: historyRef.current } })
    },
  })

  const advanceRef = useRef(null)
  const currentRef = useRef(null)
  const flippedRef = useRef(false)
  useEffect(() => { currentRef.current = current }, [current])
  useEffect(() => { flippedRef.current = flipped }, [flipped])

  const questionTimer = useCountdownTimer({
    seconds: 15,
    onExpire: () => {
      const c = currentRef.current
      if (!c) return
      recordResult(c.isoA2, 'SKIP', c.nameCommon, null, null)
      setTimeout(() => {
        setFlipped(true)
        setTimeout(() => advanceRef.current?.(), 2000)
      }, 1000)
    },
  })

  useEffect(() => {
    api.getCountries(region).then(data => {
      const gp = getGameplaySettings()
      gpRef.current = gp

      const { rating, mode } = getDifficultySettings()
      const filtered = data
        .filter(c => c.languages && c.languages.length > 0)
        .filter(difficultyFilter(rating, mode))

      let shuffled = [...filtered].sort(() => Math.random() - 0.5)
      if (gp.mode === 'maxquestions') {
        shuffled = shuffled.slice(0, Math.min(shuffled.length, gp.maxQuestions))
      }

      setTotal(shuffled.length)
      setQueue(shuffled)
      setCurrent(shuffled[0])
      setLoading(false)

      if (gp.mode === 'countdown') {
        sessionTimer.startFrom(gp.countdownSecs)
      }
    })
  }, [region])

  useEffect(() => {
    const gp = gpRef.current
    if (!gp || gp.mode !== 'maxquestions' || !gp.perQuestionTimer) return
    if (!current) return
    questionTimer.startFrom(gp.perQuestionSecs)
  }, [current])

  function advance() {
    setAnswer('')
    setFeedback(null)
    setFlashState(null)
    questionTimer.stop()
    const wasFlipped = flippedRef.current
    setFlipped(false)
    const updateQueue = () => setQueue(prev => {
      const next = prev.slice(1)
      if (next.length === 0) {
        navigate('/session-end', { state: { score, mode: 'language', region, isNewBest: savePersonalBest(), results: historyRef.current } })
        return prev
      }
      setCurrent(next[0])
      return next
    })
    if (wasFlipped) { setTimeout(updateQueue, 400) } else { updateQueue() }
  }
  useEffect(() => { advanceRef.current = advance })

  async function handleSubmit() {
    if (!answer.trim() || !current || feedback) return
    const res = await api.submitLanguageAnswer(current.isoA2, answer)
    const fb = { result: res.result, canonicalName: res.canonicalAnswer, allLanguages: res.allLanguages }
    if (res.result === 'CORRECT') {
      setFlashState('correct')
      setFeedback(fb)
      questionTimer.stop()
      recordResult(current.isoA2, 'CORRECT', res.canonicalAnswer, answer, null)
      setFlipped(true)
      setTimeout(() => advanceRef.current?.(), 700)
    } else if (res.result === 'CLOSE') {
      setFlashState('close')
      setFeedback(fb)
    } else {
      setAnswer('')
      setFlashState('wrong')
      setFeedback(null)
      setTimeout(() => { setFlashState(null); inputRef.current?.focus() }, 700)
    }
  }

  const frontContent = useMemo(() => current ? (
    <div className="flex flex-col items-center justify-center gap-2 text-center h-full">
      <p className="text-xs text-muted uppercase tracking-widest">What language(s) do they speak here?</p>
      <div className="flex items-center gap-3">
        {current.flagPngUrl && (
          <div style={{ width: 72, height: 48, flexShrink: 0 }} className="rounded overflow-hidden border border-border-col shadow-sm">
            <img src={current.flagPngUrl} alt="flag" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        )}
        <p className="text-2xl font-bold text-primary tracking-tight text-left">{current.nameCommon}</p>
      </div>
    </div>
  ) : null, [current])

  const backContent = useMemo(() => current ? (
    <div className="text-center">
      <p className="text-sm text-muted mb-1">Languages spoken in {current.nameCommon}:</p>
      <p className="text-xl font-semibold text-primary">
        {current.languages && current.languages.length > 0 ? current.languages.join(', ') : '—'}
      </p>
    </div>
  ) : null, [current])

  if (loading) return <div className="min-h-screen bg-base flex items-center justify-center text-muted">Loading…</div>
  if (!current) return null

  const gp = gpRef.current || { mode: 'none' }
  const showSessionTimer = gp.mode === 'countdown'
  const showQTimer = gp.mode === 'maxquestions' && gp.perQuestionTimer
  const qIndex = total - queue.length + 1

  return (
    <div className="min-h-screen bg-base flex flex-col">
      <QuizHeader modeName="Language" region={region} score={score} sessionTimer={sessionTimer} gp={gp} qIndex={qIndex} total={total} />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-8 flex flex-col gap-5">
        {showQTimer && (
          <QuestionTimer remaining={questionTimer.remaining} total={gp.perQuestionSecs} startKey={qIndex} />
        )}

        <FlipCard
          flashState={flashState}
          autoFlip={flipped}
          front={frontContent}
          back={backContent}
        />

        <AnswerInput
          ref={inputRef}
          value={answer}
          onChange={setAnswer}
          onSubmit={handleSubmit}
          onSkip={() => { questionTimer.stop(); recordResult(current.isoA2, 'SKIP', current.nameCommon, null, null); setFlipped(true); setTimeout(() => advanceRef.current?.(), 2000) }}
          disabled={!!feedback && feedback.result === 'CORRECT'}
          placeholder="Type a language…"
          flash={flashState}
          focusKey={qIndex}
        />

        <FeedbackBanner
          result={feedback?.result}
          hint={feedback?.hint}
          canonicalName={feedback?.canonicalName}
          onConfirm={() => {
            questionTimer.stop()
            if (feedback?.result === 'CLOSE') { recordResult(current.isoA2, 'CORRECT', feedback.canonicalName, answer, null); setFlipped(true); setTimeout(() => advanceRef.current?.(), 700) }
            else { recordResult(current.isoA2, 'SKIP', current.nameCommon, null, null); advanceRef.current?.() }
          }}
          onRetry={() => { setFeedback(null); setFlashState(null); setAnswer(''); inputRef.current?.focus() }}
        />
      </main>
    </div>
  )
}
