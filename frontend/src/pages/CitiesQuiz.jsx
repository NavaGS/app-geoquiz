import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import FlipCard from '../components/FlipCard.jsx'
import AnswerInput from '../components/AnswerInput.jsx'
import FeedbackBanner from '../components/FeedbackBanner.jsx'
import ScoreBar from '../components/ScoreBar.jsx'
import SessionTimer from '../components/SessionTimer.jsx'
import QuestionTimer from '../components/QuestionTimer.jsx'
import { useQuizSession } from '../hooks/useQuizSession.js'
import { useCountdownTimer } from '../hooks/useCountdownTimer.js'
import { api } from '../api/client.js'
import { getDifficultySettings, difficultyFilter } from '../utils/difficultySettings.js'
import { getGameplaySettings } from '../utils/gameplaySettings.js'

export default function CitiesQuiz() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state || {}
  const region = state.region || 'All'

  const [queue, setQueue] = useState([])
  const [total, setTotal] = useState(0)
  const [current, setCurrent] = useState(null)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [flashState, setFlashState] = useState(null)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(true)

  const gpRef = useRef(null)
  const scoreRef = useRef(null)
  const { score, submitAnswer, recordResult, savePersonalBest } = useQuizSession({ mode: 'cities', region })
  useEffect(() => { scoreRef.current = score }, [score])

  // Session timer
  const sessionExpiredRef = useRef(false)
  const sessionTimer = useCountdownTimer({
    seconds: 60,
    onExpire: () => {
      if (sessionExpiredRef.current) return
      sessionExpiredRef.current = true
      const isNewBest = savePersonalBest()
      navigate('/session-end', { state: { score: scoreRef.current, mode: 'cities', region, isNewBest } })
    },
  })

  // Per-question timer
  const advanceRef = useRef(null)
  const currentRef = useRef(null)
  useEffect(() => { currentRef.current = current }, [current])

  const questionTimer = useCountdownTimer({
    seconds: 15,
    onExpire: () => {
      const c = currentRef.current
      if (!c) return
      recordResult(c.country.isoA2, 'SKIP', null)
      advanceRef.current?.()
    },
  })

  useEffect(() => {
    api.getCountries(region).then(data => {
      const gp = getGameplaySettings()
      gpRef.current = gp

      const { rating, mode } = getDifficultySettings()
      const filtered = data
        .filter(c => c.cityCount > 0 && c.cityNames && c.cityNames.length > 0)
        .filter(difficultyFilter(rating, mode))

      const flat = []
      for (const country of filtered) {
        for (const cityName of country.cityNames) {
          flat.push({ cityName, country })
        }
      }
      flat.sort(() => Math.random() - 0.5)

      let finalFlat = flat
      if (gp.mode === 'maxquestions') {
        finalFlat = flat.slice(0, Math.min(flat.length, gp.maxQuestions))
      }

      setTotal(finalFlat.length)
      setQueue(finalFlat)
      setCurrent(finalFlat[0])
      setLoading(false)

      if (gp.mode === 'countdown') {
        sessionTimer.startFrom(gp.countdownSecs)
      }
    })
  }, [region])

  // Per-question timer on current change
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
    setFlipped(false)
    questionTimer.stop()
    setQueue(prev => {
      const next = prev.slice(1)
      if (next.length === 0) {
        navigate('/session-end', { state: { score, mode: 'cities', region, isNewBest: savePersonalBest() } })
        return prev
      }
      setCurrent(next[0])
      return next
    })
  }
  useEffect(() => { advanceRef.current = advance })

  async function handleSubmit() {
    if (!answer.trim() || !current || feedback) return
    const result = await submitAnswer(current.country.isoA2, answer)
    setFlashState(result.result === 'CORRECT' ? 'correct' : result.result === 'CLOSE' ? 'close' : 'wrong')
    setFeedback(result)
    if (result.result === 'CORRECT') {
      questionTimer.stop()
      recordResult(current.country.isoA2, 'CORRECT', result.canonicalName)
      setFlipped(true)
      setTimeout(advance, 1500)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading…</div>
  if (!current) return null

  const gp = gpRef.current || { mode: 'none' }
  const showSessionTimer = gp.mode === 'countdown'
  const showQTimer = gp.mode === 'maxquestions' && gp.perQuestionTimer
  const qIndex = total - queue.length + 1

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-800">← Home</button>
        <ScoreBar {...score} />
        {showSessionTimer ? (
          <SessionTimer remaining={sessionTimer.remaining} total={gp.countdownSecs} />
        ) : (
          <span className="text-sm text-gray-400">{qIndex}/{total}</span>
        )}
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-8 flex flex-col gap-5">
        {showQTimer && (
          <QuestionTimer remaining={questionTimer.remaining} total={gp.perQuestionSecs} />
        )}

        <FlipCard
          flashState={flashState}
          autoFlip={flipped}
          front={
            <div className="flex flex-col items-center gap-3 text-center">
              <p className="text-sm text-gray-500 uppercase tracking-wide">Which country is this city in?</p>
              <p className="text-4xl font-bold text-gray-800">{current.cityName}</p>
            </div>
          }
          back={
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">{current.cityName} is in</p>
              <p className="text-2xl font-bold text-purple-600">{current.country.nameCommon}</p>
              {current.country.flagPngUrl && (
                <div style={{ width: 90, height: 60 }} className="mx-auto mt-2 rounded overflow-hidden border border-gray-200">
                  <img src={current.country.flagPngUrl} alt="flag" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
            </div>
          }
        />

        <AnswerInput
          value={answer}
          onChange={setAnswer}
          onSubmit={handleSubmit}
          onSkip={() => { questionTimer.stop(); recordResult(current.country.isoA2, 'SKIP', null); advance() }}
          disabled={!!feedback && feedback.result === 'CORRECT'}
          placeholder="Type the country name…"
        />

        <FeedbackBanner
          result={feedback?.result}
          hint={feedback?.hint}
          canonicalName={feedback?.canonicalName}
          onConfirm={() => {
            questionTimer.stop()
            if (feedback?.result === 'CLOSE') { recordResult(current.country.isoA2, 'CORRECT', feedback.canonicalName); setFlipped(true); setTimeout(advance, 1200) }
            else { recordResult(current.country.isoA2, 'SKIP', null); advance() }
          }}
          onRetry={() => { setFeedback(null); setFlashState(null); setAnswer('') }}
        />
      </main>
    </div>
  )
}
