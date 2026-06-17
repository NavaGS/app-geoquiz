import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import * as d3 from 'd3'
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

function ShapeSvg({ geojsonStr }) {
  const rotationRef = useRef((Math.random() * 30 - 15).toFixed(1))

  if (!geojsonStr) return <div className="text-gray-400 text-sm">No shape data</div>

  let geojson
  try { geojson = JSON.parse(geojsonStr) } catch { return <div className="text-gray-400 text-sm">Invalid shape</div> }

  const W = 280, H = 220, PAD = 16
  const feature = { type: 'Feature', geometry: geojson, properties: {} }

  let pathData
  try {
    const centroid = d3.geoCentroid(feature)
    const projection = d3.geoAzimuthalEqualArea()
      .rotate([-centroid[0], -centroid[1]])
      .fitExtent([[PAD, PAD], [W - PAD, H - PAD]], feature)
    const pathGen = d3.geoPath().projection(projection)
    pathData = pathGen(feature)
    if (!pathData || pathData.length < 10) return <div className="text-gray-400 text-sm">Shape unavailable</div>
  } catch {
    return <div className="text-gray-400 text-sm">Shape unavailable</div>
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full max-h-48"
        style={{ overflow: 'visible', transform: `rotate(${rotationRef.current}deg)`, transformOrigin: 'center' }}
      >
        <defs>
          <filter id="shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
          </filter>
        </defs>
        <path
          d={pathData}
          fill="#0f766e"
          stroke="white"
          strokeWidth={1}
          filter="url(#shadow)"
        />
      </svg>
    </div>
  )
}

export default function ShapesQuiz() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state || {}
  const region = state.region || 'All'

  const [countries, setCountries] = useState([])
  const [queue, setQueue] = useState([])
  const [queueSize, setQueueSize] = useState(0)
  const [current, setCurrent] = useState(null)
  const [shapeData, setShapeData] = useState(null)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [flashState, setFlashState] = useState(null)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(true)

  const gpRef = useRef(null)
  const scoreRef = useRef(null)
  const { score, submitAnswer, recordResult, savePersonalBest } = useQuizSession({ mode: 'shapes', region })
  useEffect(() => { scoreRef.current = score }, [score])

  // Session timer
  const sessionExpiredRef = useRef(false)
  const sessionTimer = useCountdownTimer({
    seconds: 60,
    onExpire: () => {
      if (sessionExpiredRef.current) return
      sessionExpiredRef.current = true
      const isNewBest = savePersonalBest()
      navigate('/session-end', { state: { score: scoreRef.current, mode: 'shapes', region, isNewBest } })
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
      recordResult(c.isoA2, 'SKIP', null)
      advanceRef.current?.()
    },
  })

  useEffect(() => {
    api.getCountries(region).then(data => {
      const gp = getGameplaySettings()
      gpRef.current = gp

      const { rating, mode } = getDifficultySettings()
      const modeFiltered = data.filter(c => !!c.hasBoundary)
      const filtered = modeFiltered.filter(difficultyFilter(rating, mode))
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
  }, [region])

  useEffect(() => {
    if (!current) return
    setShapeData(null)
    api.getShape(current.isoA2).then(d => setShapeData(d)).catch(() => setShapeData(null))
  }, [current])

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
        navigate('/session-end', { state: { score, mode: 'shapes', region, isNewBest: savePersonalBest() } })
        return prev
      }
      setCurrent(next[0])
      return next
    })
  }
  useEffect(() => { advanceRef.current = advance })

  async function handleSubmit() {
    if (!answer.trim() || !current || feedback) return
    const result = await submitAnswer(current.isoA2, answer)
    setFlashState(result.result === 'CORRECT' ? 'correct' : result.result === 'CLOSE' ? 'close' : 'wrong')
    setFeedback(result)
    if (result.result === 'CORRECT') {
      questionTimer.stop()
      recordResult(current.isoA2, 'CORRECT', result.canonicalName)
      setFlipped(true)
      setTimeout(advance, 1500)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading…</div>
  if (!current) return null

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
          flashState={flashState}
          autoFlip={flipped}
          front={
            <div className="w-full flex flex-col items-center gap-2">
              <p className="text-sm text-gray-500 uppercase tracking-wide">Which country is this shape?</p>
              <ShapeSvg geojsonStr={shapeData?.geojson} />
            </div>
          }
          back={
            <div className="text-center">
              <p className="text-2xl font-bold text-teal-700">{current.nameCommon}</p>
              <p className="text-sm text-gray-500 mt-1">{current.region}</p>
            </div>
          }
        />

        <AnswerInput
          value={answer}
          onChange={setAnswer}
          onSubmit={handleSubmit}
          onSkip={() => { questionTimer.stop(); recordResult(current.isoA2, 'SKIP', null); advance() }}
          disabled={!!feedback && feedback.result === 'CORRECT'}
        />

        <FeedbackBanner
          result={feedback?.result}
          hint={feedback?.hint}
          canonicalName={feedback?.canonicalName}
          onConfirm={() => {
            questionTimer.stop()
            if (feedback?.result === 'CLOSE') { recordResult(current.isoA2, 'CORRECT', feedback.canonicalName); setFlipped(true); setTimeout(advance, 1200) }
            else { recordResult(current.isoA2, 'SKIP', null); advance() }
          }}
          onRetry={() => { setFeedback(null); setFlashState(null); setAnswer('') }}
        />
      </main>
    </div>
  )
}
