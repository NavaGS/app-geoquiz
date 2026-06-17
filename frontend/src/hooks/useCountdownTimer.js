import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * Countdown timer hook.
 * - start(): begin counting down
 * - stop(): pause
 * - reset(secs): stop and set remaining to secs (or original `seconds` if omitted)
 * - startFrom(secs): reset to secs and immediately start
 */
export function useCountdownTimer({ seconds, onExpire, autoStart = false }) {
  const [remaining, setRemaining] = useState(seconds)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef(null)
  const onExpireRef = useRef(onExpire)
  const defaultSecsRef = useRef(seconds)

  useEffect(() => { onExpireRef.current = onExpire }, [onExpire])
  useEffect(() => { defaultSecsRef.current = seconds }, [seconds])

  const stop = useCallback(() => {
    clearInterval(intervalRef.current)
    intervalRef.current = null
    setIsRunning(false)
  }, [])

  const start = useCallback(() => {
    if (intervalRef.current) return
    setIsRunning(true)
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
          setIsRunning(false)
          onExpireRef.current?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const reset = useCallback((secs) => {
    clearInterval(intervalRef.current)
    intervalRef.current = null
    setIsRunning(false)
    setRemaining(secs !== undefined ? secs : defaultSecsRef.current)
  }, [])

  const startFrom = useCallback((secs) => {
    clearInterval(intervalRef.current)
    intervalRef.current = null
    setRemaining(secs !== undefined ? secs : defaultSecsRef.current)
    setIsRunning(true)
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
          setIsRunning(false)
          onExpireRef.current?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  useEffect(() => {
    if (autoStart) start()
    return () => clearInterval(intervalRef.current)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { remaining, isRunning, start, stop, reset, startFrom }
}
