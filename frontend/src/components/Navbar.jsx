import { Link, useLocation } from 'react-router-dom'
import { Activity, Table2, Sun, Moon, Settings2 } from 'lucide-react'
import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext.jsx'
import GlobalSettingsModal from './GlobalSettingsModal.jsx'

const QUIZ_PATHS = ['/quiz/', '/session-end', '/game/']

function NavIconBtn({ icon, label, to, onClick }) {
  const inner = (
    <span className="p-2 rounded-lg text-muted hover:text-primary hover:bg-subtle transition-colors flex items-center justify-center">
      {icon}
    </span>
  )
  return (
    <div className="relative group">
      {to ? <Link to={to}>{inner}</Link> : <button onClick={onClick}>{inner}</button>}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 bg-[#0F1829] text-white text-[11px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity duration-150">
        {label}
      </div>
    </div>
  )
}

export default function Navbar() {
  const location = useLocation()
  const { theme, toggle } = useTheme()
  const [showSettings, setShowSettings] = useState(false)
  const isQuiz = QUIZ_PATHS.some(p => location.pathname.startsWith(p))

  if (isQuiz) return null

  return (
    <>
      <nav className="bg-surface border-b border-border-col h-12 flex items-center px-4 sticky top-0 z-40">
        {/* Left: brand + data icons */}
        <Link to="/" className="font-bold text-primary text-[15px] tracking-tight shrink-0 hover:opacity-80 transition-opacity mr-3">
          GeoQuiz
        </Link>
        <NavIconBtn icon={<Activity size={18} strokeWidth={1.5} />} label="Monitoring" to="/monitoring" />
        <NavIconBtn icon={<Table2 size={18} strokeWidth={1.5} />}   label="Countries Data" to="/admin" />

        {/* Right: settings + theme */}
        <div className="ml-auto flex items-center">
          <NavIconBtn icon={<Settings2 size={18} strokeWidth={1.5} />} label="Quiz Settings" onClick={() => setShowSettings(true)} />
          <NavIconBtn
            icon={theme === 'dark' ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
            label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            onClick={toggle}
          />
        </div>
      </nav>

      {showSettings && <GlobalSettingsModal onClose={() => setShowSettings(false)} />}
    </>
  )
}
