import { useNavigate } from 'react-router-dom'
import { Flag, Globe, Landmark, Building2, Hexagon, Coins, MessageSquare, Compass } from 'lucide-react'
import { getRegion } from '../utils/regionSettings.js'

const MODES = [
  { id: 'flags',    path: '/quiz/flags',    name: 'Flag Recognition', description: 'Identify countries by their flag',           Icon: Flag,          accent: '#1B3FE4' },
  { id: 'map',      path: '/quiz/map',      name: 'Map Location',     description: 'Click the highlighted country on the map',   Icon: Globe,         accent: '#0D9488' },
  { id: 'capitals', path: '/quiz/capitals', name: 'Capital City',     description: 'Name the capital city',                      Icon: Landmark,      accent: '#EA580C' },
  { id: 'cities',   path: '/quiz/cities',   name: 'Major Cities',     description: 'Name the country from its city',             Icon: Building2,     accent: '#7C3AED' },
  { id: 'shapes',   path: '/quiz/shapes',   name: 'Country Shape',    description: 'Identify a country by its outline',          Icon: Hexagon,       accent: '#0F766E' },
  { id: 'currency', path: '/quiz/currency', name: 'Currency',         description: 'Name the country by its currency',           Icon: Coins,         accent: '#CA8A04' },
  { id: 'language', path: '/quiz/language', name: 'Language',         description: 'Name an official language',                  Icon: MessageSquare, accent: '#16A34A' },
  { id: 'borders',  path: '/quiz/borders',  name: 'Borders',          description: 'Name a country that borders this one',       Icon: Compass,       accent: '#4338CA' },
]

export default function Home() {
  const navigate = useNavigate()

  function startQuiz(mode) {
    navigate(mode.path)
  }

  return (
    <div className="min-h-screen bg-base">
      <div className="px-6 pt-6 pb-3 max-w-5xl mx-auto">
        <p className="text-lg font-semibold text-primary">Quiz Modes</p>
      </div>

      <main className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 pb-8 max-w-5xl mx-auto">
        {MODES.map(mode => {
          const { Icon } = mode
          return (
            <div
              key={mode.id}
              onClick={() => startQuiz(mode)}
              className="bg-surface border border-border-col rounded-xl p-4 flex flex-col gap-2 hover:-translate-y-0.5 hover:shadow-md transition-all duration-150 cursor-pointer"
            >
              <Icon size={22} strokeWidth={1.5} style={{ color: mode.accent }} />
              <p className="font-semibold text-primary text-[14px] leading-tight">{mode.name}</p>
              <p className="text-muted text-[12px] leading-snug flex-1">{mode.description}</p>
              {/* whitespace placeholder where PB chip was */}
              <div className="h-5" />
              <button
                onClick={e => { e.stopPropagation(); startQuiz(mode) }}
                className="w-full rounded-lg py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: mode.accent }}
              >
                Start Quiz →
              </button>
            </div>
          )
        })}
      </main>
    </div>
  )
}
