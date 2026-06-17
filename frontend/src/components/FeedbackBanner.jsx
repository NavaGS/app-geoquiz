export default function FeedbackBanner({ result, hint, canonicalName, onConfirm, onRetry }) {
  if (!result) return null

  if (result === 'CORRECT') {
    return (
      <div className="w-full rounded-lg bg-green-100 border border-green-400 text-green-800 px-4 py-2 text-center font-semibold">
        Correct! 🎉
      </div>
    )
  }

  if (result === 'CLOSE') {
    return (
      <div className="w-full rounded-lg bg-amber-100 border border-amber-400 text-amber-800 px-4 py-3">
        <p className="font-medium mb-2">{hint}</p>
        <div className="flex gap-2">
          <button onClick={onConfirm} className="flex-1 py-1 bg-amber-400 text-white rounded-md text-sm font-medium hover:bg-amber-500">
            Yes, that's it!
          </button>
          <button onClick={onRetry} className="flex-1 py-1 bg-white border border-amber-400 rounded-md text-sm text-amber-700 hover:bg-amber-50">
            Let me retype
          </button>
        </div>
      </div>
    )
  }

  if (result === 'WRONG') {
    return (
      <div className="w-full rounded-lg bg-red-100 border border-red-400 text-red-800 px-4 py-3">
        <p className="font-medium mb-2">Incorrect</p>
        <div className="flex gap-2">
          <button onClick={onRetry} className="flex-1 py-1 bg-white border border-red-400 rounded-md text-sm hover:bg-red-50">
            Try Again
          </button>
          <button onClick={onConfirm} className="flex-1 py-1 bg-red-100 border border-red-400 rounded-md text-sm hover:bg-red-200">
            Skip
          </button>
        </div>
      </div>
    )
  }

  return null
}
