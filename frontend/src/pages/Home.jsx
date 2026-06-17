import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import SettingsModal from '../components/SettingsModal.jsx'

const MODES = [
  {
    id: 'flags',
    path: '/quiz/flags',
    name: 'Flag Recognition',
    description: 'Identify countries from their flags',
    icon: '🚩',
    accent: 'flags',
    border: 'border-blue-400',
    bg: 'bg-blue-50',
    btn: 'bg-blue-500 hover:bg-blue-600',
    showTimer: false,
  },
  {
    id: 'map',
    path: '/quiz/map',
    name: 'Map Location',
    description: 'Name the highlighted country on the map',
    icon: '🗺️',
    accent: 'map',
    border: 'border-green-400',
    bg: 'bg-green-50',
    btn: 'bg-green-500 hover:bg-green-600',
    showTimer: true,
  },
  {
    id: 'capitals',
    path: '/quiz/capitals',
    name: 'Capital City',
    description: 'Name the capital of each country',
    icon: '🏛️',
    accent: 'capitals',
    border: 'border-orange-400',
    bg: 'bg-orange-50',
    btn: 'bg-orange-500 hover:bg-orange-600',
    showTimer: false,
  },
  {
    id: 'cities',
    path: '/quiz/cities',
    name: 'Major Cities',
    description: 'Name the major non-capital cities',
    icon: '🏙️',
    accent: 'cities',
    border: 'border-purple-400',
    bg: 'bg-purple-50',
    btn: 'bg-purple-500 hover:bg-purple-600',
    showTimer: false,
  },
  {
    id: 'shapes',
    path: '/quiz/shapes',
    name: 'Country Shape',
    description: 'Identify countries from their silhouettes',
    icon: '🔷',
    accent: 'shapes',
    border: 'border-teal-400',
    bg: 'bg-teal-50',
    btn: 'bg-teal-500 hover:bg-teal-600',
    showTimer: false,
  },
  {
    id: 'currency',
    path: '/quiz/currency',
    name: 'Currency',
    description: 'Identify the country from its currency',
    icon: '💰',
    accent: 'currency',
    border: 'border-yellow-400',
    bg: 'bg-yellow-50',
    btn: 'bg-yellow-500 hover:bg-yellow-600',
    showTimer: false,
  },
  {
    id: 'language',
    path: '/quiz/language',
    name: 'Language',
    description: 'Name the language spoken in a country',
    icon: '🗣️',
    accent: 'language',
    border: 'border-green-400',
    bg: 'bg-green-50',
    btn: 'bg-green-500 hover:bg-green-600',
    showTimer: false,
  },
  {
    id: 'borders',
    path: '/quiz/borders',
    name: 'Borders',
    description: 'Name a country that borders the given nation',
    icon: '🧭',
    accent: 'borders',
    border: 'border-indigo-400',
    bg: 'bg-indigo-50',
    btn: 'bg-indigo-500 hover:bg-indigo-600',
    showTimer: false,
  },
]

export default function Home() {
  const navigate = useNavigate()
  const [activeModal, setActiveModal] = useState(null)
  const [settings, setSettings] = useState({ region: 'All', timer: 30 })

  function getPersonalBest(modeId) {
    return parseInt(localStorage.getItem(`pb_${modeId}_${settings.region}`) || '0', 10)
  }

  function openSettings(mode) {
    setActiveModal(mode)
  }

  function startQuiz(mode) {
    navigate(mode.path, { state: { region: settings.region, timer: settings.timer } })
    setActiveModal(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 py-6 px-4 text-center">
        <h1 className="text-3xl font-bold text-gray-800">🌍 GeoQuiz</h1>
        <p className="text-gray-500 mt-1">Test your geography knowledge</p>
        <div className="flex gap-3 justify-center mt-2">
          <Link to="/admin" className="text-xs text-gray-400 hover:text-gray-600">Admin Centre</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODES.map(mode => {
          const pb = getPersonalBest(mode.id)
          return (
            <div
              key={mode.id}
              className={`rounded-2xl border-2 ${mode.border} ${mode.bg} p-5 flex flex-col gap-3 shadow-sm`}
            >
              <div className="flex items-center justify-between">
                <span className="text-3xl">{mode.icon}</span>
                <button
                  onClick={() => openSettings(mode)}
                  title="Settings"
                  className="text-gray-400 hover:text-gray-600 text-lg"
                >
                  ⚙️
                </button>
              </div>
              <div>
                <h2 className="font-bold text-gray-800 text-base">{mode.name}</h2>
                <p className="text-gray-500 text-sm mt-0.5">{mode.description}</p>
              </div>
              {pb > 0 && (
                <p className="text-xs text-gray-400">Personal best: {pb} correct</p>
              )}
              <button
                onClick={() => navigate(mode.path, { state: { region: 'All', timer: 30 } })}
                className={`mt-auto py-2 rounded-lg text-white font-semibold text-sm ${mode.btn}`}
              >
                Start
              </button>
            </div>
          )
        })}
      </main>

      {activeModal && (
        <SettingsModal
          mode={activeModal}
          settings={settings}
          onChange={setSettings}
          onStart={() => startQuiz(activeModal)}
          onClose={() => setActiveModal(null)}
          showTimer={activeModal.showTimer}
        />
      )}
    </div>
  )
}
