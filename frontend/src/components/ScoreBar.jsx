export default function ScoreBar({ correct, wrong, skipped }) {
  return (
    <div className="flex gap-2 items-center">
      <span className="bg-subtle rounded px-2 py-0.5 text-xs flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-success inline-block" />
        <span className="text-primary font-medium">{correct}</span>
      </span>
      <span className="bg-subtle rounded px-2 py-0.5 text-xs flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-error inline-block" />
        <span className="text-primary font-medium">{wrong}</span>
      </span>
      <span className="bg-subtle rounded px-2 py-0.5 text-xs flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-muted inline-block" />
        <span className="text-primary font-medium">{skipped}</span>
      </span>
    </div>
  )
}
