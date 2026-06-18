import { useState } from 'react'
import { X } from 'lucide-react'
import { DIFFICULTY_LABELS, getDifficultySettings, setDifficultySettings } from '../utils/difficultySettings.js'
import { getGameplaySettings, setGameplaySettings } from '../utils/gameplaySettings.js'
import { REGIONS, getRegion, setRegion } from '../utils/regionSettings.js'

export default function GlobalSettingsModal({ onClose }) {
  const diff = getDifficultySettings()
  const gp = getGameplaySettings()

  const [region, setRegionState] = useState(getRegion())
  const [diffRating, setDiffRating] = useState(diff.rating)
  const [diffMode, setDiffMode] = useState(diff.mode)
  const [gpMode, setGpMode] = useState(gp.mode)
  const [countdownSecs, setCountdownSecs] = useState(gp.countdownSecs)
  const [maxQuestions, setMaxQuestions] = useState(gp.maxQuestions)
  const [perQTimer, setPerQTimer] = useState(gp.perQuestionTimer)
  const [perQSecs, setPerQSecs] = useState(gp.perQuestionSecs)
  const [saved, setSaved] = useState(false)

  function save() {
    setRegion(region)
    setDifficultySettings(diffRating, diffMode)
    setGameplaySettings({ mode: gpMode, countdownSecs, maxQuestions, perQuestionTimer: perQTimer, perQuestionSecs: perQSecs })
    setSaved(true)
    setTimeout(onClose, 700)
  }

  return (
    <div className="fixed inset-0 bg-[rgba(8,13,26,0.65)] flex items-end sm:items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-surface border border-border-col rounded-2xl shadow-xl w-full sm:w-96 max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-col sticky top-0 bg-surface rounded-t-2xl z-10">
          <p className="font-semibold text-primary text-sm">Quiz Settings</p>
          <button onClick={onClose} className="p-1 text-muted hover:text-primary rounded transition-colors">
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-6">

          {/* Region */}
          <section>
            <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">Region</p>
            <div className="grid grid-cols-3 gap-2">
              {REGIONS.map(r => (
                <button
                  key={r}
                  onClick={() => setRegionState(r)}
                  className={`rounded-lg border py-2 text-xs font-medium transition-colors ${
                    region === r
                      ? 'border-accent bg-[var(--accent-glow)] text-accent'
                      : 'border-border-col text-muted hover:border-accent/50 hover:text-primary'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </section>

          {/* Difficulty */}
          <section>
            <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">Difficulty</p>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-secondary">Max level</span>
                  <span className="text-xs font-semibold text-primary">{DIFFICULTY_LABELS[diffRating - 1]}</span>
                </div>
                <input
                  type="range" min="1" max="5" value={diffRating}
                  onChange={e => setDiffRating(Number(e.target.value))}
                  className="w-full accent-[var(--accent)]"
                />
                <div className="flex justify-between text-[11px] text-muted mt-0.5">
                  <span>Very Easy</span><span>Very Hard</span>
                </div>
              </div>
              <div className="flex gap-2">
                {[
                  { val: 'inclusive', label: 'All-Inclusive', desc: `≤ ${DIFFICULTY_LABELS[diffRating - 1]}` },
                  { val: 'exact',     label: 'Exact only',   desc: DIFFICULTY_LABELS[diffRating - 1] },
                ].map(opt => (
                  <button
                    key={opt.val}
                    onClick={() => setDiffMode(opt.val)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                      diffMode === opt.val
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

          {/* Game Play Mode */}
          <section>
            <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">Game Play</p>
            <div className="flex gap-2 mb-3">
              {[
                { val: 'none',         label: 'Free Play' },
                { val: 'countdown',    label: 'Countdown' },
                { val: 'maxquestions', label: 'Max Questions' },
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => setGpMode(opt.val)}
                  className={`flex-1 rounded-lg border py-2 text-xs font-medium transition-colors ${
                    gpMode === opt.val
                      ? 'border-accent bg-[var(--accent-glow)] text-accent'
                      : 'border-border-col text-muted hover:border-accent/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {gpMode === 'countdown' && (
              <label className="block">
                <span className="text-xs text-muted block mb-1">Session duration (seconds)</span>
                <input
                  type="number" min="10" max="600" value={countdownSecs}
                  onChange={e => setCountdownSecs(parseInt(e.target.value) || 60)}
                  className="w-full bg-subtle border border-border-col rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent font-mono"
                />
              </label>
            )}

            {gpMode === 'maxquestions' && (
              <div className="space-y-3">
                <label className="block">
                  <span className="text-xs text-muted block mb-1">Questions per session</span>
                  <input
                    type="number" min="1" max="200" value={maxQuestions}
                    onChange={e => setMaxQuestions(parseInt(e.target.value) || 20)}
                    className="w-full bg-subtle border border-border-col rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent font-mono"
                  />
                </label>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary">Timer per question</span>
                  <button
                    onClick={() => setPerQTimer(v => !v)}
                    className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${perQTimer ? 'bg-accent' : 'bg-subtle border border-border-col'}`}
                  >
                    <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all" style={{ left: perQTimer ? '22px' : '2px' }} />
                  </button>
                </div>
                {perQTimer && (
                  <label className="block">
                    <span className="text-xs text-muted block mb-1">Seconds per question</span>
                    <input
                      type="number" min="5" max="120" value={perQSecs}
                      onChange={e => setPerQSecs(parseInt(e.target.value) || 15)}
                      className="w-full bg-subtle border border-border-col rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent font-mono"
                    />
                  </label>
                )}
              </div>
            )}
          </section>
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={save}
            className="w-full py-2.5 bg-accent text-white rounded-lg font-semibold hover:opacity-90 transition-opacity text-sm"
          >
            {saved ? 'Saved ✓' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
