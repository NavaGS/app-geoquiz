export default function QuestionTimer({ remaining, total }) {
  const pct = total > 0 ? (remaining / total) * 100 : 0
  const barColor = pct > 50 ? 'var(--accent)' : pct > 25 ? 'var(--warning)' : 'var(--error)'

  return (
    <div className="w-full h-[3px] bg-subtle rounded-full overflow-hidden">
      <div
        className="h-full transition-all duration-1000 rounded-full"
        style={{ width: `${pct}%`, backgroundColor: barColor }}
      />
    </div>
  )
}
