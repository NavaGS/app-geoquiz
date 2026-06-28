import { useState, useEffect, useRef, useMemo } from 'react'
import FlipCard from '../components/FlipCard.jsx'
import AnswerInput from '../components/AnswerInput.jsx'
import FeedbackBanner from '../components/FeedbackBanner.jsx'
import QuizHeader from '../components/QuizHeader.jsx'
import QuestionTimer from '../components/QuestionTimer.jsx'
import { useQuizCore } from '../hooks/useQuizCore.js'
import { api } from '../api/client.js'
import { getRegion } from '../utils/regionSettings.js'

function dedupeByCurrency(countries) {
  const seen = new Set()
  const unique = []
  for (const c of countries) {
    if (c.currencyCode && !seen.has(c.currencyCode)) {
      seen.add(c.currencyCode)
      unique.push(c)
    }
  }
  return unique
}

export default function CurrencyQuiz() {
  const region = getRegion()

  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [flashState, setFlashState] = useState(null)
  const [matchedCountry, setMatchedCountry] = useState(null)
  const inputRef = useRef()

  const {
    current, loading, error, queueSize, qIndex, gp,
    flipped, setFlipped,
    score, historyRef, recordResult,
    sessionTimer, questionTimer,
    advanceRef, advanceQueue,
    beginSubmit, endSubmit,
    sessionId, userId,
  } = useQuizCore({
    mode: 'currency',
    region,
    filterFn: c => !!c.currencyName,
    buildQueue: dedupeByCurrency,
    getIso: c => c.isoA2,
    getCanonical: c => c.nameCommon,
  })

  function advance() {
    setAnswer('')
    setFeedback(null)
    setFlashState(null)
    setMatchedCountry(null)
    advanceQueue()
  }
  useEffect(() => { advanceRef.current = advance })

  async function handleSubmit() {
    if (!answer.trim() || !current || feedback) return
    if (!beginSubmit()) return
    const res = await api.submitCurrencyAnswer(current.isoA2, answer, sessionId, region, userId)
    if (res.result === 'CORRECT') {
      setFlashState('correct')
      setMatchedCountry(res.canonicalAnswer)
      setFeedback({ result: 'CORRECT', canonicalName: res.canonicalAnswer })
      questionTimer.stop()
      recordResult(current.isoA2, 'CORRECT', res.canonicalAnswer, answer, null)
      setFlipped(true)
      setTimeout(() => advanceRef.current?.(), 700)
    } else if (res.result === 'CLOSE') {
      endSubmit()
      questionTimer.stop()
      setFlashState('close')
      setFeedback({ result: 'CLOSE', canonicalName: res.canonicalAnswer })
    } else {
      endSubmit()
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
  if (error)   return <div className="min-h-screen bg-base flex items-center justify-center text-error">{error}</div>
  if (!current) return null

  const showQTimer = gp.mode === 'maxquestions' && gp.perQuestionTimer

  return (
    <div className="min-h-screen bg-base flex flex-col">
      <QuizHeader modeName="Currency" region={region} score={score} sessionTimer={sessionTimer} gp={gp} qIndex={qIndex} total={queueSize} />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-8 flex flex-col gap-5">
        {showQTimer && <QuestionTimer remaining={questionTimer.remaining} total={gp.perQuestionSecs} startKey={qIndex} />}
        <FlipCard flashState={flashState} autoFlip={flipped} front={frontContent} back={backContent} />
        <AnswerInput
          ref={inputRef}
          value={answer}
          onChange={setAnswer}
          onSubmit={handleSubmit}
          onSkip={() => {
            questionTimer.stop()
            recordResult(current.isoA2, 'SKIP', current.nameCommon, null, null)
            setFlipped(true)
            setTimeout(() => advanceRef.current?.(), 2000)
          }}
          disabled={!!feedback && feedback.result === 'CORRECT'}
          placeholder="Type a country name…"
          flash={flashState}
          focusKey={qIndex}
        />
        <FeedbackBanner
          result={feedback?.result}
          canonicalName={feedback?.canonicalName}
          onConfirm={() => {
            questionTimer.stop()
            if (feedback?.result === 'CLOSE') {
              recordResult(current.isoA2, 'CORRECT', feedback.canonicalName, answer, null)
              setFlipped(true)
              setTimeout(() => advanceRef.current?.(), 700)
            }
          }}
          onRetry={() => { setFeedback(null); setFlashState(null); setAnswer(''); inputRef.current?.focus() }}
        />
      </main>
    </div>
  )
}
