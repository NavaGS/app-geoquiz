import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import FlipCard from '../components/FlipCard.jsx'
import AnswerInput from '../components/AnswerInput.jsx'
import QuizHeader from '../components/QuizHeader.jsx'
import QuestionTimer from '../components/QuestionTimer.jsx'
import { useQuizSession } from '../hooks/useQuizSession.js'
import { useCountdownTimer } from '../hooks/useCountdownTimer.js'
import { api } from '../api/client.js'
import { getDifficultySettings, difficultyFilter } from '../utils/difficultySettings.js'
import { getGameplaySettings } from '../utils/gameplaySettings.js'
import { getRegion } from '../utils/regionSettings.js'

export default function CurrencyQuiz() {
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
  const [matchedCountry, setMatchedCountry] = useState(null)
  const [loading, setLoading] = useState(true)

  const gpRef = useRef(null)
  const scoreRef = useRef(null)
  const { score, recordResult, savePersonalBest } = useQuizSession({ mode: 'currency', region })
  useEffect(() => { scoreRef.current = score }, [score])

  const sessionExpiredRef = useRef(false)
  const sessionTimer = useCountdownTimer({
    seconds: 60,
    onExpire: () => {
      if (sessionExpiredRef.current) return
      sessionExpiredRef.current = true
      const isNewBest = savePersonalBest()
      navigate('/session-end', { state: { score: scoreRef.current, mode: 'currency', region, isNewBest } })
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
      recordResult(c.isoA2, 'SKIP', null)
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
        .filter(c => !!c.currencyName)
        .filter(difficultyFilter(rating, mode))

      // Each currency appears once — deduplicate by currency code
      const seen = new Set()
      const unique = []
      for (const c of filtered) {
        if (c.currencyCode && !seen.has(c.currencyCode)) {
          seen.add(c.currencyCode)
          unique.push(c)
        }
      }

      let shuffled = [...unique].sort(() => Math.random() - 0.5)
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
    setMatchedCountry(null)
    questionTimer.stop()
    const wasFlipped = flippedRef.current
    setFlipped(false)
    const updateQueue = () => setQueue(prev => {
      const next = prev.slice(1)
      if (next.length === 0) {
        navigate('/session-end', { state: { score, mode: 'currency', region, isNewBest: savePersonalBest() } })
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
    const res = await api.submitCurrencyAnswer(current.isoA2, answer)
    if (res.result === 'CORRECT') {
      setFlashState('correct')
      setMatchedCountry(res.canonicalAnswer)
      setFeedback({ result: 'CORRECT', canonicalName: res.canonicalAnswer })
      questionTimer.stop()
      recordResult(current.isoA2, 'CORRECT', res.canonicalAnswer)
      setFlipped(true)
      setTimeout(advance, 700)
    } else {
      setAnswer('')
      setFlashState('wrong')
      setTimeout(() => { setFlashState(null); inputRef.current?.focus() }, 700)
    }
  }

  const frontContent = useMemo(() => current ? (
    <div className="flex flex-col items-center gap-2 text-center">
      <p className="text-xs text-muted uppercase tracking-widest">Which country uses this currency?</p>
      <p className="text-5xl font-bold text-primary">{current.currencySymbol || current.currencyCode}</p>
      <p className="text-2xl font-semibold text-primary">{current.currencyName}</p>
      <p className="text-sm text-muted font-mono">{current.currencyCode}</p>
    </div>
  ) : null, [current])

  const backContent = useMemo(() => current ? (
    <div className="text-center">
      <p className="text-2xl font-bold text-primary tracking-tight">{matchedCountry || current.nameCommon}</p>
      <p className="text-sm text-muted mt-1">{current.currencyName} · {current.currencyCode}</p>
    </div>
  ) : null, [current, matchedCountry])

  if (loading) return <div className="min-h-screen bg-base flex items-center justify-center text-muted">Loading…</div>
  if (!current) return null

  const gp = gpRef.current || { mode: 'none' }
  const showQTimer = gp.mode === 'maxquestions' && gp.perQuestionTimer
  const qIndex = total - queue.length + 1

  return (
    <div className="min-h-screen bg-base flex flex-col">
      <QuizHeader modeName="Currency" region={region} score={score} sessionTimer={sessionTimer} gp={gp} qIndex={qIndex} total={total} />

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
          onSkip={() => {
            questionTimer.stop()
            recordResult(current.isoA2, 'SKIP', null)
            setFlipped(true)
            setTimeout(() => advanceRef.current?.(), 2000)
          }}
          disabled={!!feedback && feedback.result === 'CORRECT'}
          placeholder="Type a country name…"
          flash={flashState}
          focusKey={qIndex}
        />
      </main>
    </div>
  )
}
