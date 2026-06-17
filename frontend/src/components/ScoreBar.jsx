export default function ScoreBar({ correct, wrong, skipped }) {
  return (
    <div className="flex gap-4 text-sm font-semibold">
      <span className="text-green-500">✓ {correct}</span>
      <span className="text-red-500">✗ {wrong}</span>
      <span className="text-gray-400">→ {skipped}</span>
    </div>
  )
}
