export default function SessionTimer({ remaining, total }) {
  const pct = total > 0 ? (remaining / total) * 100 : 0
  const barColor = pct > 50 ? 'bg-green-500' : pct > 25 ? 'bg-amber-500' : 'bg-red-500'

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  const urgent = remaining <= 10

  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[56px]">
      <span className={`text-sm font-mono font-semibold tabular-nums ${urgent ? 'text-red-500 animate-pulse' : 'text-gray-600'}`}>
        {timeStr}
      </span>
      <div className="w-14 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 rounded-full ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
