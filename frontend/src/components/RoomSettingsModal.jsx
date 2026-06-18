import { useState } from 'react'
import { X } from 'lucide-react'
import { DIFFICULTY_LABELS } from '../utils/difficultySettings.js'

const QUESTION_COUNTS = [5, 10, 15, 20]
const TIME_LIMITS = [5, 10, 15]

export default function RoomSettingsModal({ initial, onSave, onClose }) {
  const [difficultyRating, setDifficultyRating] = useState(initial.difficultyRating)
  const [difficultyMode, setDifficultyMode] = useState(initial.difficultyMode)
  const [maxQuestions, setMaxQuestions] = useState(initial.maxQuestions)
  const [questionDurationSeconds, setQuestionDurationSeconds] = useState(initial.questionDurationSeconds)
  const [responseAttempts, setResponseAttempts] = useState(initial.responseAttempts)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await onSave({ difficultyRating, difficultyMode, maxQuestions, questionDurationSeconds, responseAttempts })
      setSaved(true)
      setTimeout(onClose, 600)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-[rgba(8,13,26,0.65)] flex items-end sm:items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border-col rounded-2xl shadow-xl w-full sm:w-96 max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-col sticky top-0 bg-surface rounded-t-2xl z-10">
          <p className="font-semibold text-primary text-sm">Game Settings</p>
          <button onClick={onClose} className="p-1 text-muted hover:text-primary rounded transition-colors">
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-6">

          {/* Difficulty */}
          <section>
            <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">Difficulty</p>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-secondary">Level</span>
                  <span className="text-xs font-semibold text-primary">{DIFFICULTY_LABELS[difficultyRating - 1]}</span>
                </div>
                <input
                  type="range" min="1" max="5" value={difficultyRating}
                  onChange={e => setDifficultyRating(Number(e.target.value))}
                  className="w-full accent-[var(--accent)]"
                />
                <div className="flex justify-between text-[11px] text-muted mt-0.5">
                  <span>Very Easy</span><span>Very Hard</span>
                </div>
              </div>
              <div className="flex gap-2">
                {[
                  { val: 'inclusive', label: 'All-Inclusive', desc: `≤ ${DIFFICULTY_LABELS[difficultyRating - 1]}` },
                  { val: 'exact',     label: 'Only',          desc: DIFFICULTY_LABELS[difficultyRating - 1] },
                ].map(opt => (
                  <button
                    key={opt.val}
                    onClick={() => setDifficultyMode(opt.val)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                      difficultyMode === opt.val
                        ? 'border-accent bg-[var(--accent-glow)] text-accent'
                        : 'border-border-col text-muted hover:border-accent/50'
                    }`}
                  >
                    <p className="font-semibold">{opt.label}</p>
                    <p className="opacity-70 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Questions */}
          <section>
            <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">Questions</p>
            <div className="grid grid-cols-4 gap-2">
              {QUESTION_COUNTS.map(n => (
                <button
                  key={n}
                  onClick={() => setMaxQuestions(n)}
                  className={`rounded-lg border py-2 text-xs font-medium transition-colors ${
                    maxQuestions === n
                      ? 'border-accent bg-[var(--accent-glow)] text-accent'
                      : 'border-border-col text-muted hover:border-accent/50 hover:text-primary'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </section>

          {/* Time per question */}
          <section>
            <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">Time per question</p>
            <div className="grid grid-cols-3 gap-2">
              {TIME_LIMITS.map(s => (
                <button
                  key={s}
                  onClick={() => setQuestionDurationSeconds(s)}
                  className={`rounded-lg border py-2 text-xs font-medium transition-colors ${
                    questionDurationSeconds === s
                      ? 'border-accent bg-[var(--accent-glow)] text-accent'
                      : 'border-border-col text-muted hover:border-accent/50 hover:text-primary'
                  }`}
                >
                  {s}s
                </button>
              ))}
            </div>
          </section>

          {/* Response attempts */}
          <section>
            <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">Response attempts</p>
            <div className="flex gap-2">
              {[
                { val: 'unlimited', label: 'Unlimited', desc: 'Retry until timer ends' },
                { val: 'single',    label: 'Single',    desc: 'One submission only' },
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => setResponseAttempts(opt.val)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                    responseAttempts === opt.val
                      ? 'border-accent bg-[var(--accent-glow)] text-accent'
                      : 'border-border-col text-muted hover:border-accent/50'
                  }`}
                >
                  <p className="font-semibold">{opt.label}</p>
                  <p className="opacity-70 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </section>

        </div>

        <div className="px-5 pb-5">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 bg-accent text-white rounded-lg font-semibold hover:opacity-90 transition-opacity text-sm disabled:opacity-60"
          >
            {saved ? 'Saved ✓' : saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
