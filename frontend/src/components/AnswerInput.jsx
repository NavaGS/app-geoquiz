import { useRef, useEffect } from 'react'

export default function AnswerInput({ value, onChange, onSubmit, onSkip, disabled, placeholder = 'Type a country…' }) {
  const inputRef = useRef()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); onSubmit?.() }
    if (e.key === 'Tab')   { e.preventDefault(); onSkip?.() }
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full h-11 bg-subtle border border-border-col rounded-lg px-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-accent focus:ring-2 disabled:opacity-50"
        style={{ '--tw-ring-color': 'var(--accent-glow)' }}
      />
      <div className="flex justify-end gap-4">
        <button
          onClick={onSubmit}
          disabled={disabled}
          className="text-accent text-sm font-medium disabled:opacity-50 hover:text-accent-hover"
        >
          Submit
        </button>
        <button
          onClick={onSkip}
          disabled={disabled}
          className="text-muted text-sm disabled:opacity-50 hover:text-secondary"
        >
          Skip
        </button>
      </div>
    </div>
  )
}
