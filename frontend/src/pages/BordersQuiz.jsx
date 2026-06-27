import { useState, useEffect, useRef, useMemo } from 'react'
import FlipCard from '../components/FlipCard.jsx'
import AnswerInput from '../components/AnswerInput.jsx'
import FeedbackBanner from '../components/FeedbackBanner.jsx'
import QuizHeader from '../components/QuizHeader.jsx'
import QuestionTimer from '../components/QuestionTimer.jsx'
import { useQuizCore } from '../hooks/useQuizCore.js'
import { api } from '../api/client.js'
import { getRegion } from '../utils/regionSettings.js'

export default function BordersQuiz() {
  const region = getRegion()

  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [flashState, setFlashState] = useState(null)
  const [lastBorderNames, setLastBorderNames] = useState([])
  const inputRef = useRef()
  const preFetchedBorderNamesRef = useRef([])

  const {
    current, loading, error, queueSize, qIndex, gp,
    flipped, setFlipped,
    score, historyRef, recordResult,
    sessionTimer, questionTimer,
    advanceRef, advanceQueue,
  } = useQuizCore({
    mode: 'borders',
    region,
    filterFn: c => c.borders && c.borders.length > 0,
    getIso: c => c.isoA2,
    getCanonical: () => null,
  })

  // Pre-fetch border names on each question so skip/expire can reveal them immediately
  useEffect(() => {
    if (!current) return
    preFetchedBorderNamesRef.current = []
    api.submitBorderAnswer(current.isoA2, '').then(res => {
      preFetchedBorderNamesRef.current = res.borderNames || []
    }).catch(() => {})
  }, [current])

  function advance() {
    setAnswer('')
    setFeedback(null)
    setFlashState(null)
    setLastBorderNames([])
    advanceQueue()
  }
  useEffect(() => { advanceRef.current = advance })

  async function handleSubmit() {
    if (!answer.trim() || !current || feedback) return
    const res = await api.submitBorderAnswer(current.isoA2, answer)
    const borderNames = res.borderNames || []
    setLastBorderNames(borderNames)
    if (res.result === 'CORRECT') {
      setFlashState('correct')
      setFeedback({ result: 'CORRECT', canonicalName: res.canonicalAnswer, borderNames })
      recordResult(current.isoA2, 'CORRECT', res.canonicalAnswer, answer, null)
      setFlipped(true)
      setTimeout(() => advanceRef.current?.(), 700)
    } else {
      setAnswer('')
      setFlashState('wrong')
      setFeedback(null)
      setTimeout(() => { setFlashState(null); inputRef.current?.focus() }, 700)
    }
  }

  const frontContent = useMemo(() => current ? (
    <div className="flex flex-col items-center justify-center gap-2 text-center h-full">
      <p className="text-xs text-muted uppercase tracking-widest">Name a bordering country</p>
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
    <div className="flex flex-col items-center justify-center text-center h-full gap-2">
      <p className="text-xs text-muted uppercase tracking-widest">Borders of {current.nameCommon}</p>
      <p className="text-sm font-semibold text-primary leading-relaxed">
        {lastBorderNames.length > 0 ? lastBorderNames.join(' · ') : '—'}
      </p>
    </div>
  ) : null, [current, lastBorderNames])

  if (loading) return <div className="min-h-screen bg-base flex items-center justify-center text-muted">Loading…</div>
  if (error)   return <div className="min-h-screen bg-base flex items-center justify-center text-error">{error}</div>
  if (!current) return null

  const showQTimer = gp.mode === 'maxquestions' && gp.perQuestionTimer

  return (
    <div className="min-h-screen bg-base flex flex-col">
      <QuizHeader modeName="Borders" region={region} score={score} sessionTimer={sessionTimer} gp={gp} qIndex={qIndex} total={queueSize} />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-8 flex flex-col gap-5">
        {showQTimer && <QuestionTimer remaining={questionTimer.remaining} total={gp.perQuestionSecs} startKey={qIndex} />}
        <FlipCard
          flashState={flashState}
          autoFlip={flipped}
          front={frontContent}
          back={backContent}
          onFlip={() => setLastBorderNames(preFetchedBorderNamesRef.current)}
        />
        <AnswerInput
          ref={inputRef}
          value={answer}
          onChange={setAnswer}
          onSubmit={handleSubmit}
          onSkip={() => {
            questionTimer.stop()
            recordResult(current.isoA2, 'SKIP', null, null, null)
            setLastBorderNames(preFetchedBorderNamesRef.current)
            setFlipped(true)
            setTimeout(() => advanceRef.current?.(), 2000)
          }}
          disabled={!!feedback && feedback.result === 'CORRECT'}
          placeholder="Type a bordering country…"
          flash={flashState}
          focusKey={qIndex}
        />
        <FeedbackBanner
          result={feedback?.result}
          hint={feedback?.hint}
          canonicalName={feedback?.canonicalName}
          onConfirm={() => {
            questionTimer.stop()
            recordResult(current.isoA2, 'SKIP', null, null, null)
            advanceRef.current?.()
          }}
          onRetry={() => { setFeedback(null); setFlashState(null); setAnswer(''); inputRef.current?.focus() }}
        />
      </main>
    </div>
  )
}
