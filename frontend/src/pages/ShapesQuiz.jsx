import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import * as d3 from 'd3'
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
import { useTheme } from '../contexts/ThemeContext.jsx'

function ShapeSvg({ geojsonStr }) {
  const { theme } = useTheme()
  const rotationRef = useRef((Math.random() * 30 - 15).toFixed(1))

  const shapeFill = theme === 'dark' ? '#4F70FF' : '#1B3FE4'

  if (!geojsonStr) return <div className="text-muted text-sm">No shape data</div>

  let geojson
  try { geojson = JSON.parse(geojsonStr) } catch { return <div className="text-muted text-sm">Invalid shape</div> }

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
    if (!pathData || pathData.length < 10) return <div className="text-muted text-sm">Shape unavailable</div>
  } catch {
    return <div className="text-muted text-sm">Shape unavailable</div>
  }

  return (
    <div className="w-full flex items-center justify-center" style={{ height: 160, overflow: 'hidden' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: '100%', transform: `rotate(${rotationRef.current}deg)`, transformOrigin: 'center' }}
      >
        <defs>
          <filter id="shapeShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
          </filter>
        </defs>
        <path
          d={pathData}
          fill={shapeFill}
          stroke="white"
          strokeWidth={1}
          filter="url(#shapeShadow)"
        />
      </svg>
    </div>
  )
}

export default function ShapesQuiz() {
  const navigate = useNavigate()
  const region = getRegion()

  const [countries, setCountries] = useState([])
  const [queue, setQueue] = useState([])
  const [queueSize, setQueueSize] = useState(0)
  const [current, setCurrent] = useState(null)
  const [shapeData, setShapeData] = useState(null)
  const inputRef = useRef()
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [flashState, setFlashState] = useState(null)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(true)

  const gpRef = useRef(null)
  const scoreRef = useRef(null)
  const { score, submitAnswer, recordResult, savePersonalBest } = useQuizSession({ mode: 'shapes', region })
  useEffect(() => { scoreRef.current = score }, [score])

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
        navigate('/session-end', { state: { score, mode: 'shapes', region, isNewBest: savePersonalBest() } })
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
    const result = await submitAnswer(current.isoA2, answer)
    if (result.result === 'CORRECT') {
      setFlashState('correct')
      setFeedback(result)
      questionTimer.stop()
      recordResult(current.isoA2, 'CORRECT', result.canonicalName)
      setFlipped(true)
      setTimeout(advance, 700)
    } else if (result.result === 'CLOSE') {
      setFlashState('close')
      setFeedback(result)
    } else {
      setAnswer('')
      setFlashState('wrong')
      setFeedback(null)
      setTimeout(() => { setFlashState(null); inputRef.current?.focus() }, 700)
    }
  }

  const frontContent = useMemo(() => current ? (
    <div className="w-full flex flex-col items-center justify-center gap-2 h-full">
      <p className="text-xs text-muted uppercase tracking-widest">Which country is this shape?</p>
      <ShapeSvg geojsonStr={shapeData?.geojson} />
    </div>
  ) : null, [current, shapeData])

  const backContent = useMemo(() => current ? (
    <div className="text-center">
      <p className="text-2xl font-bold text-primary tracking-tight">{current.nameCommon}</p>
      <p className="text-sm text-muted mt-1">{current.region}</p>
    </div>
  ) : null, [current])

  if (loading) return <div className="min-h-screen bg-base flex items-center justify-center text-muted">Loading…</div>
  if (!current) return null

  const gp = gpRef.current || { mode: 'none' }
  const showSessionTimer = gp.mode === 'countdown'
  const showQTimer = gp.mode === 'maxquestions' && gp.perQuestionTimer
  const qIndex = queueSize - queue.length + 1

  return (
    <div className="min-h-screen bg-base flex flex-col">
      <QuizHeader modeName="Country Shape" region={region} score={score} sessionTimer={sessionTimer} gp={gp} qIndex={qIndex} total={queueSize} />

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
          onSkip={() => { questionTimer.stop(); recordResult(current.isoA2, 'SKIP', null); setFlipped(true); setTimeout(() => advanceRef.current?.(), 2000) }}
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
            if (feedback?.result === 'CLOSE') { recordResult(current.isoA2, 'CORRECT', feedback.canonicalName); setFlipped(true); setTimeout(advance, 700) }
            else { recordResult(current.isoA2, 'SKIP', null); advance() }
          }}
          onRetry={() => { setFeedback(null); setFlashState(null); setAnswer(''); inputRef.current?.focus() }}
        />
      </main>
    </div>
  )
}
