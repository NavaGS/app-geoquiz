import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Flag, Globe, Landmark, Building2, Hexagon, Coins, MessageSquare, Compass, LayoutDashboard } from 'lucide-react'
import SettingsModal from '../components/SettingsModal.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'

const MODES = [
  {
    id: 'flags',
    path: '/quiz/flags',
    name: 'Flag Recognition',
    description: 'Identify countries by their flag',
    Icon: Flag,
    accent: '#1B3FE4',
    showTimer: false,
  },
  {
    id: 'map',
    path: '/quiz/map',
    name: 'Map Location',
    description: 'Click the highlighted country',
    Icon: Globe,
    accent: '#0D9488',
    showTimer: true,
  },
  {
    id: 'capitals',
    path: '/quiz/capitals',
    name: 'Capital City',
    description: 'Name the capital city',
    Icon: Landmark,
    accent: '#EA580C',
    showTimer: false,
  },
  {
    id: 'cities',
    path: '/quiz/cities',
    name: 'Major Cities',
    description: 'Name the country from its city',
    Icon: Building2,
    accent: '#7C3AED',
    showTimer: false,
  },
  {
    id: 'shapes',
    path: '/quiz/shapes',
    name: 'Country Shape',
    description: 'Identify a country by its outline',
    Icon: Hexagon,
    accent: '#0F766E',
    showTimer: false,
  },
  {
    id: 'currency',
    path: '/quiz/currency',
    name: 'Currency',
    description: 'Name the country by its currency',
    Icon: Coins,
    accent: '#CA8A04',
    showTimer: false,
  },
  {
    id: 'language',
    path: '/quiz/language',
    name: 'Language',
    description: 'Name an official language',
    Icon: MessageSquare,
    accent: '#16A34A',
    showTimer: false,
  },
  {
    id: 'borders',
    path: '/quiz/borders',
    name: 'Borders',
    description: 'Name a country that borders this one',
    Icon: Compass,
    accent: '#4338CA',
    showTimer: false,
  },
]

export default function Home() {
  const navigate = useNavigate()
  const [activeModal, setActiveModal] = useState(null)
  const [settings, setSettings] = useState({ region: 'All', timer: 30 })

  function getPersonalBest(modeId) {
    const raw = localStorage.getItem(`pb_${modeId}_${settings.region}`)
    return raw ? parseInt(raw, 10) : null
  }

  function startQuiz(mode) {
    navigate(mode.path, { state: { region: settings.region, timer: settings.timer } })
    setActiveModal(null)
  }

  return (
    <div className="min-h-screen bg-base">
      {/* Zone 1 — Hero header (always dark) */}
      <header className="bg-[#0F1829] px-8 py-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight font-sans">GeoQuiz</h1>
          <p className="text-sm text-slate-400 mt-1">Navigate the world.</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            to="/admin"
            aria-label="Admin"
            className="p-2 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <LayoutDashboard size={20} strokeWidth={1.5} />
          </Link>
        </div>
      </header>

      {/* Zone 2 — Mode grid */}
      <main className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 max-w-5xl mx-auto">
        {MODES.map(mode => {
          const pb = getPersonalBest(mode.id)
          const { Icon } = mode
          return (
            <div
              key={mode.id}
              onClick={() => setActiveModal(mode)}
              className="bg-surface border border-border-col rounded-xl p-4 flex flex-col gap-2 hover:-translate-y-0.5 hover:shadow-md transition-all duration-150 cursor-pointer"
            >
              <Icon size={24} strokeWidth={1.5} style={{ color: mode.accent }} />
              <p className="font-semibold text-primary text-base leading-tight">{mode.name}</p>
              <p className="text-muted text-[13px] leading-snug">{mode.description}</p>
              <div className="flex items-center gap-2">
                <span className="bg-subtle rounded px-2 py-0.5 text-xs text-muted">
                  PB: {pb !== null ? pb : '—'}
                </span>
              </div>
              <button
                onClick={e => { e.stopPropagation(); setActiveModal(mode) }}
                className="mt-auto w-full rounded-lg py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: mode.accent }}
              >
                Start Quiz →
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
