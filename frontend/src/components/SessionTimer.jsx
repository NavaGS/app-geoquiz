function fmt(secs) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function SessionTimer({ remaining, total }) {
  const pct = total > 0 ? (remaining / total) * 100 : 0
  const urgent = remaining <= 10
  const color = pct > 50 ? 'var(--success)' : pct > 25 ? 'var(--warning)' : 'var(--error)'

  return (
    <div className={`flex items-center gap-2 ${urgent ? 'text-error' : 'text-primary'}`}>
      <svg width="144" height="4" viewBox="0 0 144 4" className="shrink-0">
        <rect x="0" y="0" width="144" height="4" rx="2" fill="var(--border)" />
        <rect x="0" y="0" width={144 * pct / 100} height="4" rx="2" fill={color}
          style={{ transition: 'width 1s linear, fill 0.5s ease' }} />
      </svg>
      <span className="font-mono text-sm font-semibold tabular-nums">{fmt(remaining)}</span>
    </div>
  )
}
