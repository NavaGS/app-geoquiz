import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * Drift-free countdown timer.
 *
 * Instead of decrementing a counter on each interval tick (which accumulates
 * drift), we record an absolute end time and compute the remaining seconds
 * from `Date.now()` on each poll.  The poll interval is 200 ms so expiry
 * is detected within 200 ms of the real zero-crossing.  React state is only
 * updated when the displayed integer second changes, so the render rate stays
 * at ~1 Hz regardless of the poll interval.
 *
 * Public API (unchanged):
 *   remaining  — integer seconds remaining
 *   isRunning  — boolean
 *   start()    — resume (or start) from current remaining
 *   stop()     — pause
 *   reset(s?)  — stop and reset to s (or the original `seconds`)
 *   startFrom(s?) — reset to s and immediately start
 */
export function useCountdownTimer({ seconds, onExpire, autoStart = false }) {
  const [remaining, setRemaining] = useState(seconds)
  const [isRunning, setIsRunning] = useState(false)

  const intervalRef = useRef(null)
  const remainingRef = useRef(seconds)   // mirror of displayed remaining (int)
  const endTimeRef = useRef(null)        // absolute end timestamp (ms)
  const pausedMsRef = useRef(null)       // ms left when stop() was called
  const onExpireRef = useRef(onExpire)
  const defaultSecsRef = useRef(seconds)

  useEffect(() => { onExpireRef.current = onExpire }, [onExpire])
  useEffect(() => { defaultSecsRef.current = seconds }, [seconds])

  const tick = useCallback(() => {
    const newRemaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000))
    if (newRemaining !== remainingRef.current) {
      remainingRef.current = newRemaining
      setRemaining(newRemaining)
    }
    if (newRemaining <= 0) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
      setIsRunning(false)
      onExpireRef.current?.()
    }
  }, [])

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
      // Preserve sub-second residual so start() can resume accurately
      pausedMsRef.current = endTimeRef.current
        ? Math.max(0, endTimeRef.current - Date.now())
        : null
      endTimeRef.current = null
    }
    setIsRunning(false)
  }, [])

  const reset = useCallback((secs) => {
    clearInterval(intervalRef.current)
    intervalRef.current = null
    endTimeRef.current = null
    pausedMsRef.current = null
    setIsRunning(false)
    const val = secs !== undefined ? secs : defaultSecsRef.current
    remainingRef.current = val
    setRemaining(val)
  }, [])

  const start = useCallback(() => {
    if (intervalRef.current) return
    // Resume from wherever stop() left off; fall back to current remaining display
    const resumeMs = pausedMsRef.current ?? remainingRef.current * 1000
    endTimeRef.current = Date.now() + resumeMs
    pausedMsRef.current = null
    setIsRunning(true)
    intervalRef.current = setInterval(tick, 200)
  }, [tick])

  const startFrom = useCallback((secs) => {
    clearInterval(intervalRef.current)
    intervalRef.current = null
    pausedMsRef.current = null
    const val = secs !== undefined ? secs : defaultSecsRef.current
    remainingRef.current = val
    setRemaining(val)
    endTimeRef.current = Date.now() + val * 1000
    setIsRunning(true)
    intervalRef.current = setInterval(tick, 200)
  }, [tick])

  useEffect(() => {
    if (autoStart) start()
    return () => clearInterval(intervalRef.current)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { remaining, isRunning, start, stop, reset, startFrom }
}
