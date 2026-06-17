const REGIONS = ['All', 'Africa', 'Americas', 'Asia', 'Europe', 'Oceania']

export default function SettingsModal({ mode, settings, onChange, onStart, onClose, showTimer }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl p-6 w-80" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-4">Quiz Settings</h2>

        <label className="block mb-3">
          <span className="text-sm text-gray-600 font-medium">Region</span>
          <select
            value={settings.region}
            onChange={e => onChange({ ...settings, region: e.target.value })}
            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            {REGIONS.map(r => <option key={r}>{r}</option>)}
          </select>
        </label>

        {showTimer && (
          <label className="block mb-3">
            <span className="text-sm text-gray-600 font-medium">Timer per country (seconds)</span>
            <input
              type="number"
              min="5"
              max="120"
              value={settings.timer}
              onChange={e => onChange({ ...settings, timer: parseInt(e.target.value) || 30 })}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </label>
        )}

        <button
          onClick={onStart}
          className="w-full py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 mt-2"
        >
          Start Quiz
        </button>
      </div>
    </div>
  )
}
