import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuizSession } from './useQuizSession.js'
import { useCountdownTimer } from './useCountdownTimer.js'
import { api } from '../api/client.js'
import { getDifficultySettings, difficultyFilter } from '../utils/difficultySettings.js'
import { getGameplaySettings } from '../utils/gameplaySettings.js'

/**
 * Shared quiz state machine used by all standalone quiz pages.
 *
 * Handles: country loading, queue management, session/question timers,
 * and session score tracking. The FlipCard flip state is also managed here.
 *
 * The component MUST set advanceRef.current to its own advance() function,
 * which should call advanceQueue() after resetting any mode-specific local
 * state (answer, feedback, flashState, etc.).
 *
 * Params:
 *   mode, region, evalMode   — passed through to useQuizSession / submitAnswer
 *   filterFn(country)        — additional filter applied after difficulty filter
 *   buildQueue(countries)    — optional: transform filtered countries into queue items
 *                              (CitiesQuiz uses this to flatten into city entries)
 *   getIso(item)             — extract ISO A2 string from a queue item
 *   getCanonical(item)       — extract canonical answer name for SKIP records (optional)
 *   getCard(item)            — extract card metadata for history (optional)
 *   onQuestionExpire         — optional override for question timer expire behaviour;
 *                              defaults to SKIP + flip + advance after 3 s
 *                              (MapQuiz uses a custom expire to show revealName instead)
 */
export function useQuizCore({
  mode,
  region,
  evalMode,
  filterFn,
  buildQueue,
  getIso,
  getCanonical,
  getCard,
  onQuestionExpire,
}) {
  const navigate = useNavigate()

  const [queue, setQueue] = useState([])
  const [queueSize, setQueueSize] = useState(0)
  const [current, setCurrent] = useState(null)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const gpRef = useRef(null)
  const scoreRef = useRef(null)
  const currentRef = useRef(null)
  const flippedRef = useRef(false)
  const advanceRef = useRef(null)
  const sessionExpiredRef = useRef(false)
  const savePersonalBestRef = useRef(null)

  useEffect(() => { currentRef.current = current }, [current])
  useEffect(() => { flippedRef.current = flipped }, [flipped])

  const { score, submitAnswer, recordResult, savePersonalBest, historyRef } =
    useQuizSession({ mode, evalMode, region })

  useEffect(() => { scoreRef.current = score }, [score])
  useEffect(() => { savePersonalBestRef.current = savePersonalBest }, [savePersonalBest])

  // Default question timer expire: record skip, flip card, then advance
  const defaultQuestionExpire = useCallback(() => {
    const c = currentRef.current
    if (!c) return
    recordResult(getIso(c), 'SKIP', getCanonical?.(c) ?? null, null, getCard?.(c) ?? null)
    setTimeout(() => {
      setFlipped(true)
      setTimeout(() => advanceRef.current?.(), 2000)
    }, 1000)
  }, [getIso, getCanonical, getCard, recordResult])

  const sessionTimer = useCountdownTimer({
    seconds: 60,
    onExpire: useCallback(() => {
      if (sessionExpiredRef.current) return
      sessionExpiredRef.current = true
      const c = currentRef.current
      const last = historyRef.current[historyRef.current.length - 1]
      const iso = c ? getIso(c) : null
      const unanswered = iso && (!last || last.countryIso !== iso)
      if (unanswered) recordResult(iso, 'SKIP', getCanonical?.(c) ?? null, null, getCard?.(c) ?? null)
      const isNewBest = savePersonalBestRef.current?.() ?? false
      const sessionScore = unanswered
        ? { ...scoreRef.current, skipped: scoreRef.current.skipped + 1 }
        : scoreRef.current
      navigate('/session-end', { state: { score: sessionScore, mode, region, isNewBest, results: historyRef.current } })
    }, [mode, region, getIso, getCanonical, getCard, recordResult, navigate]),
  })

  const questionTimer = useCountdownTimer({
    seconds: 15,
    onExpire: onQuestionExpire ?? defaultQuestionExpire,
  })

  // Load and prepare the question queue
  useEffect(() => {
    api.getCountries(region)
      .then(data => {
        const gp = getGameplaySettings()
        gpRef.current = gp

        const { rating, mode: diffMode } = getDifficultySettings()
        const diffFn = difficultyFilter(rating, diffMode)
        const filtered = (filterFn ? data.filter(filterFn) : data).filter(diffFn)
        const items = buildQueue ? buildQueue(filtered) : filtered
        let shuffled = [...items].sort(() => Math.random() - 0.5)

        if (gp.mode === 'maxquestions') {
          shuffled = shuffled.slice(0, Math.min(shuffled.length, gp.maxQuestions))
        }

        setQueueSize(shuffled.length)
        setQueue(shuffled)
        setCurrent(shuffled[0] ?? null)
        setLoading(false)

        if (gp.mode === 'countdown') sessionTimer.startFrom(gp.countdownSecs)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [region]) // eslint-disable-line react-hooks/exhaustive-deps

  // Start per-question timer whenever the current question changes
  useEffect(() => {
    const gp = gpRef.current
    if (!gp || gp.mode !== 'maxquestions' || !gp.perQuestionTimer || !current) return
    questionTimer.startFrom(gp.perQuestionSecs)
  }, [current]) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Core queue step. Call from the component's advance() wrapper AFTER resetting
   * mode-specific local state (answer, feedback, flashState, etc.).
   */
  const advanceQueue = () => {
    questionTimer.stop()
    const wasFlipped = flippedRef.current
    setFlipped(false)
    const doUpdate = () => setQueue(prev => {
      const next = prev.slice(1)
      if (next.length === 0) {
        const isNewBest = savePersonalBestRef.current?.() ?? false
        navigate('/session-end', {
          state: { score: scoreRef.current, mode, region, isNewBest, results: historyRef.current },
        })
        return prev
      }
      setCurrent(next[0])
      return next
    })
    if (wasFlipped) setTimeout(doUpdate, 400)
    else doUpdate()
  }

  return {
    // Current question and queue
    current, loading, error,
    queue, queueSize, qIndex: queueSize - queue.length + 1,
    gp: gpRef.current ?? { mode: 'none' },
    // Flip state (used by FlipCard)
    flipped, setFlipped, flippedRef,
    // Quiz session (scores, history, answer submission)
    score, historyRef, submitAnswer, recordResult, savePersonalBest,
    // Timers
    sessionTimer, questionTimer,
    // Refs exposed for component use
    gpRef, currentRef, advanceRef, scoreRef,
    // Queue advancement — wrap this in the component's advance()
    advanceQueue,
  }
}
