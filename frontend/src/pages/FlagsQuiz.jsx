import { useState, useEffect, useRef, useMemo } from 'react'
import FlipCard from '../components/FlipCard.jsx'
import AnswerInput from '../components/AnswerInput.jsx'
import FeedbackBanner from '../components/FeedbackBanner.jsx'
import QuizHeader from '../components/QuizHeader.jsx'
import QuestionTimer from '../components/QuestionTimer.jsx'
import { useQuizCore } from '../hooks/useQuizCore.js'
import { getRegion } from '../utils/regionSettings.js'

export default function FlagsQuiz() {
  const region = getRegion()

  const [answer, setAnswer]       = useState('')
  const [feedback, setFeedback]   = useState(null)
  const [flashState, setFlashState] = useState(null)
  const inputRef = useRef()

  const {
    current, loading, error, queueSize, qIndex, gp,
    flipped, setFlipped,
    score, submitAnswer, recordResult,
    sessionTimer, questionTimer,
    advanceRef, advanceQueue,
    beginSubmit, endSubmit,
  } = useQuizCore({
    mode: 'flags',
    region,
    filterFn:    c => !!c.flagPngUrl,
    getIso:      c => c.isoA2,
    getCanonical: c => c.nameCommon,
  })

  function advance() {
    setAnswer('')
    setFeedback(null)
    setFlashState(null)
    advanceQueue()
  }
  useEffect(() => { advanceRef.current = advance })

  async function handleSubmit() {
    if (!answer.trim() || !current || feedback) return
    if (!beginSubmit()) return
    const result = await submitAnswer(current.isoA2, answer)
    if (result.result === 'CORRECT') {
      setFlashState('correct')
      setFeedback(result)
      questionTimer.stop()
      recordResult(current.isoA2, 'CORRECT', result.canonicalName, answer, null)
      setFlipped(true)
      setTimeout(() => advanceRef.current?.(), 700)
    } else if (result.result === 'CLOSE') {
      endSubmit()
      questionTimer.stop()
      setFlashState('close')
      setFeedback(result)
    } else {
      endSubmit()
      setAnswer('')
      setFlashState('wrong')
      setFeedback(null)
      setTimeout(() => { setFlashState(null); inputRef.current?.focus() }, 700)
    }
  }

  const frontContent = useMemo(() => current ? (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs text-muted font-medium uppercase tracking-widest">Which country is this flag?</p>
      {current.flagPngUrl
        ? <div style={{ width: 240, height: 160 }} className="rounded-lg overflow-hidden border border-border-col shadow-sm">
            <img src={current.flagPngUrl} alt="flag" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        : <div style={{ width: 240, height: 160 }} className="bg-subtle rounded-lg flex items-center justify-center text-muted">No flag</div>
      }
    </div>
  ) : null, [current])

  const backContent = useMemo(() => current ? (
    <div className="text-center">
      <p className="text-2xl font-bold text-primary tracking-tight">{current.nameCommon}</p>
      <p className="text-sm text-secondary mt-1">{current.nameOfficial}</p>
      <p className="text-xs text-muted mt-1">{current.region} · {current.subregion}</p>
    </div>
  ) : null, [current])

  if (loading) return <div className="min-h-screen bg-base flex items-center justify-center text-muted">Loading…</div>
  if (error)   return <div className="min-h-screen bg-base flex items-center justify-center text-error">{error}</div>
  if (!current) return null

  const showQTimer = gp.mode === 'maxquestions' && gp.perQuestionTimer

  return (
    <div className="min-h-screen bg-base flex flex-col">
      <QuizHeader modeName="Flag Finder" region={region} score={score} sessionTimer={sessionTimer} gp={gp} qIndex={qIndex} total={queueSize} />
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
          flash={flashState}
          focusKey={qIndex}
        />
        <FeedbackBanner
          result={feedback?.result}
          hint={feedback?.hint}
          canonicalName={feedback?.canonicalName}
          onConfirm={() => {
            questionTimer.stop()
            if (feedback?.result === 'CLOSE') {
              recordResult(current.isoA2, 'CORRECT', feedback.canonicalName, answer, null)
              setFlipped(true)
              setTimeout(() => advanceRef.current?.(), 700)
            } else {
              recordResult(current.isoA2, 'SKIP', current.nameCommon, null, null)
              advanceRef.current?.()
            }
          }}
          onRetry={() => { setFeedback(null); setFlashState(null); setAnswer(''); inputRef.current?.focus() }}
        />
      </main>
    </div>
  )
}
