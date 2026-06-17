import { useState, useEffect } from 'react'

export default function QuestionTimer({ remaining, total, startKey }) {
  const [animWidth, setAnimWidth] = useState(100)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setAnimWidth(100)
    setReady(false)
    const id = requestAnimationFrame(() => {
      setReady(true)
      setAnimWidth(0)
    })
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
            width: `${animWidth}%`,
            backgroundColor: barColor,
            transition: ready ? `width ${total}s linear` : 'none',
          }}
        />
      </div>
      <span className={`text-xs font-mono tabular-nums shrink-0 ${textColor}`}>{remaining}s</span>
    </div>
  )
}
