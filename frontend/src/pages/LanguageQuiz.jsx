import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
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

export default function LanguageQuiz() {
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
  const { score, recordResult, savePersonalBest } = useQuizSession({ mode: 'language', region })
  useEffect(() => { scoreRef.current = score }, [score])

  const sessionExpiredRef = useRef(false)
  const sessionTimer = useCountdownTimer({
    seconds: 60,
    onExpire: () => {
      if (sessionExpiredRef.current) return
      sessionExpiredRef.current = true
      const isNewBest = savePersonalBest()
      navigate('/session-end', { state: { score: scoreRef.current, mode: 'language', region, isNewBest } })
    },
  })

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
    setFlipped(false)
    questionTimer.stop()
    setQueue(prev => {
      const next = prev.slice(1)
      if (next.length === 0) {
        navigate('/session-end', { state: { score, mode: 'language', region, isNewBest: savePersonalBest() } })
        return prev
      }
      setCurrent(next[0])
      return next
    })
  }
  useEffect(() => { advanceRef.current = advance })

  async function handleSubmit() {
    if (!answer.trim() || !current || feedback) return
    const res = await api.submitLanguageAnswer(current.isoA2, answer)
    setFlashState(res.result === 'CORRECT' ? 'correct' : res.result === 'CLOSE' ? 'close' : 'wrong')
    const fb = { result: res.result, canonicalName: res.canonicalAnswer, allLanguages: res.allLanguages }
    setFeedback(fb)
    if (res.result === 'CORRECT') {
      questionTimer.stop()
      recordResult(current.isoA2, 'CORRECT', res.canonicalAnswer)
      setFlipped(true)
      setTimeout(advance, 1500)
    }
  }

  if (loading) return <div className="min-h-screen bg-base flex items-center justify-center text-muted">Loading…</div>
  if (!current) return null

  const gp = gpRef.current || { mode: 'none' }
  const showSessionTimer = gp.mode === 'countdown'
  const showQTimer = gp.mode === 'maxquestions' && gp.perQuestionTimer
  const qIndex = total - queue.length + 1

  return (
    <div className="min-h-screen bg-base flex flex-col">
      <header className="bg-surface border-b border-border-col h-[52px] flex items-center px-4 gap-4">
        <Link to="/" className="text-muted hover:text-primary transition-colors" aria-label="Back to home">
          <ArrowLeft size={16} strokeWidth={1.5} />
        </Link>
        <div className="flex-1 flex items-center gap-2">
          <span className="font-semibold text-primary text-sm">Language</span>
          {region !== 'All' && (
            <span className="bg-subtle text-muted text-xs px-2 py-0.5 rounded">{region}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <ScoreBar {...score} />
          {showSessionTimer ? (
            <SessionTimer remaining={sessionTimer.remaining} total={gp.countdownSecs} />
          ) : (
            <span className="text-xs font-mono text-muted">{qIndex}/{total}</span>
          )}
        </div>
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
              <p className="text-xs text-muted uppercase tracking-widest">What language(s) do they speak in {current.nameCommon}?</p>
              {current.flagPngUrl && (
                <div style={{ width: 240, height: 160 }} className="rounded-lg overflow-hidden border border-border-col shadow-sm">
                  <img src={current.flagPngUrl} alt="flag" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
              )}
              <p className="text-2xl font-bold text-primary tracking-tight">{current.nameCommon}</p>
            </div>
          }
          back={
            <div className="text-center">
              <p className="text-sm text-muted mb-1">Languages spoken in {current.nameCommon}:</p>
              <p className="text-xl font-semibold text-primary">
                {current.languages && current.languages.length > 0
                  ? current.languages.join(', ')
                  : '—'}
              </p>
            </div>
          }
        />

        <AnswerInput
          value={answer}
          onChange={setAnswer}
          onSubmit={handleSubmit}
          onSkip={() => { questionTimer.stop(); recordResult(current.isoA2, 'SKIP', null); advance() }}
          disabled={!!feedback && feedback.result === 'CORRECT'}
          placeholder="Type a language…"
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
