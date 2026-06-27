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
  const remainingRef = useRef(seconds)
  const onExpireRef = useRef(onExpire)
  const defaultSecsRef = useRef(seconds)

  useEffect(() => { onExpireRef.current = onExpire }, [onExpire])
  useEffect(() => { defaultSecsRef.current = seconds }, [seconds])

  const tick = useCallback(() => {
    remainingRef.current -= 1
    setRemaining(remainingRef.current)
    if (remainingRef.current <= 0) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
      setIsRunning(false)
      onExpireRef.current?.()
    }
  }, [])

  const stop = useCallback(() => {
    clearInterval(intervalRef.current)
    intervalRef.current = null
    setIsRunning(false)
  }, [])

  const start = useCallback(() => {
    if (intervalRef.current) return
    setIsRunning(true)
    intervalRef.current = setInterval(tick, 1000)
  }, [tick])

  const reset = useCallback((secs) => {
    clearInterval(intervalRef.current)
    intervalRef.current = null
    setIsRunning(false)
    const val = secs !== undefined ? secs : defaultSecsRef.current
    remainingRef.current = val
    setRemaining(val)
  }, [])

  const startFrom = useCallback((secs) => {
    clearInterval(intervalRef.current)
    intervalRef.current = null
    const val = secs !== undefined ? secs : defaultSecsRef.current
    remainingRef.current = val
    setRemaining(val)
    setIsRunning(true)
    intervalRef.current = setInterval(tick, 1000)
  }, [tick])

  useEffect(() => {
    if (autoStart) start()
    return () => clearInterval(intervalRef.current)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { remaining, isRunning, start, stop, reset, startFrom }
}
