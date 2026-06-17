import { useRef, useEffect } from 'react'

export default function AnswerInput({ value, onChange, onSubmit, onSkip, disabled, placeholder = 'Type country name…' }) {
  const inputRef = useRef()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); onSubmit?.() }
    if (e.key === 'Tab')   { e.preventDefault(); onSkip?.() }
  }

  return (
    <div className="flex gap-2 w-full">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
      />
      <button
        onClick={onSubmit}
        disabled={disabled}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50"
      >
        Submit
      </button>
      <button
        onClick={onSkip}
        disabled={disabled}
        className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 text-sm"
      >
        Skip
      </button>
    </div>
  )
}
