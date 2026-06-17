import { useState, useEffect, useRef, useCallback } from 'react'

export default function FlipCard({ front, back, onFlip, autoFlip = false, flashState }) {
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    if (autoFlip) setFlipped(true)
  }, [autoFlip])

  const flip = useCallback(() => {
    setFlipped(f => !f)
    onFlip?.()
  }, [onFlip])

  // Reset on new question
  useEffect(() => {
    setFlipped(false)
  }, [front])

  const flashClass =
    flashState === 'correct' ? 'flash-correct' :
    flashState === 'wrong'   ? 'flash-wrong'   :
    flashState === 'close'   ? 'flash-close'   : ''

  return (
    <div className={`flip-card w-full h-64 cursor-pointer select-none ${flashClass}`} onClick={flip}>
      <div className={`flip-card-inner w-full h-full ${flipped ? 'flipped' : ''}`}>
        <div className="flip-card-front bg-white rounded-2xl shadow-md flex items-center justify-center p-4">
          {front}
        </div>
        <div className="flip-card-back bg-white rounded-2xl shadow-md flex items-center justify-center p-4">
          {back}
        </div>
      </div>
    </div>
  )
}
