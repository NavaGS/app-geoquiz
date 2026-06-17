export default function QuestionTimer({ remaining, total }) {
  const pct = total > 0 ? (remaining / total) * 100 : 0
  const barColor = pct > 50 ? 'bg-teal-500' : pct > 25 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
      <div
        className={`h-full transition-all duration-1000 rounded-full ${barColor}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
