import { useState, useEffect, useCallback } from 'react'

export default function FlipCard({ front, back, onFlip, autoFlip = false, flashState }) {
  const [flipped, setFlipped] = useState(false)

  // Drive flip state from autoFlip only — the parent's advance() resets autoFlip
  // to false on each new question, which is the sole reliable trigger for un-flipping.
  // Including `front` caused cards to snap back whenever frontContent was recomputed
  // (e.g. every timer tick in FlagsQuiz/CapitalsQuiz due to inline renderFront refs).
  useEffect(() => {
    setFlipped(autoFlip)
  }, [autoFlip])

  const flip = useCallback(() => {
    setFlipped(f => !f)
    onFlip?.()
  }, [onFlip])

  const flashClass =
    flashState === 'correct' ? 'flash-correct' :
    flashState === 'wrong'   ? 'flash-wrong'   :
    flashState === 'close'   ? 'flash-close'   : ''

  return (
    <div className={`flip-card w-full h-56 cursor-pointer select-none ${flashClass}`} onClick={flip}>
      <div className={`flip-card-inner w-full h-full ${flipped ? 'flipped' : ''}`}>
        <div className="flip-card-front bg-surface border border-border-col rounded-xl shadow-sm flex items-center justify-center p-4">
          {front}
        </div>
        <div className="flip-card-back bg-surface border border-border-col rounded-xl shadow-sm flex items-center justify-center p-4" aria-live="polite">
          {back}
        </div>
      </div>
    </div>
  )
}
