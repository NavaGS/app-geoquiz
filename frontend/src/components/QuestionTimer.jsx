import { useState, useEffect } from 'react'

export default function QuestionTimer({ remaining, total, startKey }) {
  const [flash, setFlash] = useState(false)

  // Instant reset on new question, then smooth transitions
  useEffect(() => {
    setFlash(true)
    const id = requestAnimationFrame(() => setFlash(false))
    return () => cancelAnimationFrame(id)
  }, [startKey])

  const pct = total > 0 ? remaining / total : 0
  const barColor = pct > 0.5 ? 'var(--accent)' : pct > 0.25 ? 'var(--warning)' : 'var(--error)'
  const textColor = pct > 0.25 ? 'text-muted' : 'text-error'

  return (
    <div className="w-full flex items-center gap-2">
      <div className="flex-1 h-[3px] bg-subtle rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct * 100}%`,
            backgroundColor: barColor,
            transition: flash ? 'none' : 'width 1s linear',
          }}
        />
      </div>
      <span className={`text-xs font-mono tabular-nums shrink-0 ${textColor}`}>{remaining}s</span>
    </div>
  )
}
