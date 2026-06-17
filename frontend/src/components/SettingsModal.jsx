const REGIONS = ['All', 'Africa', 'Americas', 'Asia', 'Europe', 'Oceania']

export default function SettingsModal({ mode, settings, onChange, onStart, onClose, showTimer }) {
  return (
    <div className="fixed inset-0 bg-[rgba(8,13,26,0.6)] flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-surface rounded-t-2xl sm:rounded-xl shadow-xl p-6 w-full sm:w-80 border border-border-col"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-primary mb-4">Quiz Settings</h2>

        <label className="block mb-4">
          <span className="text-xs font-medium text-muted uppercase tracking-widest block mb-2">Region</span>
          <select
            value={settings.region}
            onChange={e => onChange({ ...settings, region: e.target.value })}
            className="block w-full bg-subtle border border-border-col rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
          >
            {REGIONS.map(r => <option key={r}>{r}</option>)}
          </select>
        </label>

        {showTimer && (
          <label className="block mb-4">
            <span className="text-xs font-medium text-muted uppercase tracking-widest block mb-2">Timer per country (seconds)</span>
            <input
              type="number"
              min="5"
              max="120"
              value={settings.timer}
              onChange={e => onChange({ ...settings, timer: parseInt(e.target.value) || 30 })}
              className="block w-full bg-subtle border border-border-col rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
            />
          </label>
        )}

        <button
          onClick={onStart}
          className="w-full py-2.5 bg-accent text-white rounded-lg font-semibold hover:opacity-90 transition-opacity mt-2 text-sm"
        >
          Start Quiz →
        </button>
      </div>
    </div>
  )
}
