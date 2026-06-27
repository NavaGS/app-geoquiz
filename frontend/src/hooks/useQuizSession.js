import { useState, useCallback, useRef } from 'react'
import { api } from '../api/client.js'
import { v4 as uuidv4 } from '../utils/uuid.js'

export function useQuizSession({ mode, evalMode, region }) {
  const sessionId = useRef(uuidv4())
  const [score, setScore] = useState({ correct: 0, wrong: 0, skipped: 0 })
  const historyRef = useRef([])

  const submitAnswer = useCallback(async (countryIso, answer) => {
    try {
      const result = await api.submitAnswer({
        countryIso,
        answer,
        mode: evalMode || mode,
        sessionId: sessionId.current,
      })
      return result
    } catch (e) {
      console.error('Answer submission failed:', e)
      return { result: 'WRONG', similarityScore: 0 }
    }
  }, [mode, evalMode])

  const recordResult = useCallback((countryIso, resultType, canonicalName, userAnswer = null, card = null) => {
    setScore(prev => ({
      ...prev,
      correct: prev.correct + (resultType === 'CORRECT' ? 1 : 0),
      wrong: prev.wrong + (resultType === 'WRONG' ? 1 : 0),
      skipped: prev.skipped + (resultType === 'SKIP' ? 1 : 0),
    }))
    historyRef.current = [...historyRef.current, { countryIso, resultType, canonicalName, userAnswer, card }]
  }, [])

  const savePersonalBest = useCallback(() => {
    const key = `pb_${mode}_${region || 'All'}`
    const prev = parseInt(localStorage.getItem(key) || '0', 10)
    if (score.correct > prev) {
      localStorage.setItem(key, String(score.correct))
      return true
    }
    return false
  }, [mode, region, score.correct])

  const getPersonalBest = useCallback(() => {
    const key = `pb_${mode}_${region || 'All'}`
    return parseInt(localStorage.getItem(key) || '0', 10)
  }, [mode, region])

  return {
    sessionId: sessionId.current,
    score,
    historyRef,
    submitAnswer,
    recordResult,
    savePersonalBest,
    getPersonalBest,
  }
}
