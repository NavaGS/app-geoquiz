import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react'

const AnswerInput = forwardRef(function AnswerInput(
  { value, onChange, onSubmit, onSkip, disabled, placeholder = 'Type a country…', flash, focusKey },
  ref
) {
  const inputRef = useRef()
  const [skipping, setSkipping] = useState(false)

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }))

  useEffect(() => {
    setSkipping(false)
    inputRef.current?.focus()
  }, [focusKey])

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); onSubmit?.() }
    if (e.key === 'Tab') {
      e.preventDefault()
      if (!skipping && !disabled) { setSkipping(true); onSkip?.() }
    }
  }

  const borderClass =
    flash === 'correct' ? 'border-success ring-2 ring-success/30' :
    flash === 'wrong'   ? 'border-error ring-2 ring-error/30' :
    'border-border-col focus:border-accent focus:ring-2'

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
        className={`w-full h-11 bg-subtle border rounded-lg px-3 text-sm text-primary placeholder:text-muted focus:outline-none disabled:opacity-50 transition-colors ${borderClass}`}
        style={{ '--tw-ring-color': 'var(--accent-glow)' }}
      />
      <div className="flex justify-end gap-4">
        <button
          onClick={onSubmit}
          disabled={disabled}
          className="text-accent text-sm font-medium disabled:opacity-50 hover:text-accent-hover"
        >
          Enter
        </button>
        <button
          onClick={() => { if (!skipping && !disabled) { setSkipping(true); onSkip?.() } }}
          disabled={disabled || skipping}
          className="text-muted text-sm disabled:opacity-50 hover:text-secondary"
        >
          Skip
        </button>
      </div>
    </div>
  )
})

export default AnswerInput
