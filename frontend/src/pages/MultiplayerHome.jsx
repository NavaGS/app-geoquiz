import { useNavigate } from 'react-router-dom'
import { Users, Plus, LogIn } from 'lucide-react'

export default function MultiplayerHome() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-base flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-2">
          <Users size={26} strokeWidth={1.5} style={{ color: '#7C3AED' }} />
          <h1 className="text-2xl font-bold text-primary tracking-tight">Multiplayer</h1>
        </div>
        <p className="text-muted text-sm mb-8">Play live with friends in a private room</p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/room/create')}
            className="flex items-center gap-3 w-full rounded-xl bg-surface border border-border-col p-4 hover:-translate-y-0.5 hover:shadow-md transition-all duration-150 text-left"
          >
            <span className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(124,58,237,0.1)' }}>
              <Plus size={20} strokeWidth={1.5} style={{ color: '#7C3AED' }} />
            </span>
            <div>
              <p className="font-semibold text-primary text-sm">Create a Room</p>
              <p className="text-xs text-muted mt-0.5">Host a game and share the code</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/room/join')}
            className="flex items-center gap-3 w-full rounded-xl bg-surface border border-border-col p-4 hover:-translate-y-0.5 hover:shadow-md transition-all duration-150 text-left"
          >
            <span className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(124,58,237,0.1)' }}>
              <LogIn size={20} strokeWidth={1.5} style={{ color: '#7C3AED' }} />
            </span>
            <div>
              <p className="font-semibold text-primary text-sm">Join a Room</p>
              <p className="text-xs text-muted mt-0.5">Enter a 6-character room code</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
