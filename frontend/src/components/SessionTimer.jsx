export default function SessionTimer({ remaining, total }) {
  const pct = total > 0 ? (remaining / total) * 100 : 0
  const urgent = remaining <= 10

  const strokeColor = pct > 50 ? 'var(--success)' : pct > 25 ? 'var(--warning)' : 'var(--error)'

  const R = 16
  const circumference = 2 * Math.PI * R
  const dashOffset = circumference * (1 - pct / 100)

  return (
    <div className="flex items-center justify-center relative w-10 h-10">
      <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90">
        <circle cx="20" cy="20" r={R} fill="none" stroke="var(--border)" strokeWidth="3" />
        <circle
          cx="20" cy="20" r={R}
          fill="none"
          stroke={strokeColor}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
        />
      </svg>
      <span className={`absolute font-mono text-[10px] font-semibold tabular-nums ${urgent ? 'text-error' : 'text-primary'}`}>
        {remaining}
      </span>
    </div>
  )
}
