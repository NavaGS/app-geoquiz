export default function FeedbackBanner({ result, hint, canonicalName, onConfirm, onRetry }) {
  if (!result) return null

  if (result === 'CORRECT') {
    return (
      <div className="w-full border-l-4 border-success pl-3 py-2 flex items-center gap-2">
        <span className="text-success font-semibold text-sm">Correct — {canonicalName}</span>
      </div>
    )
  }

  if (result === 'CLOSE') {
    return (
      <div className="w-full border-l-4 border-warning pl-3 py-2">
        <p className="text-warning font-medium text-sm mb-2">{hint}</p>
        <div className="flex gap-2">
          <button onClick={onConfirm} className="px-3 py-1 bg-warning text-white rounded text-xs font-medium hover:opacity-90">
            Yes, that's it!
          </button>
          <button onClick={onRetry} className="px-3 py-1 border border-warning text-warning rounded text-xs hover:opacity-80">
            Let me retype
          </button>
        </div>
      </div>
    )
  }

  return null
}
