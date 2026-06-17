import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import ScoreBar from './ScoreBar.jsx'
import SessionTimer from './SessionTimer.jsx'

export default function QuizHeader({ modeName, region, score, sessionTimer, gp, qIndex, total, counterLabel }) {
  const showSessionTimer = gp?.mode === 'countdown'

  return (
    <header className="bg-surface border-b border-border-col h-[52px] flex items-center px-4 gap-4 shrink-0">
      <Link to="/" className="text-muted hover:text-primary transition-colors" aria-label="Back to home">
        <ArrowLeft size={16} strokeWidth={1.5} />
      </Link>
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <span className="font-semibold text-primary text-sm truncate">{modeName}</span>
        {region && region !== 'All' && (
          <span className="bg-subtle text-muted text-xs px-2 py-0.5 rounded shrink-0">{region}</span>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <ScoreBar {...score} />
        {showSessionTimer
          ? <SessionTimer remaining={sessionTimer.remaining} total={gp.countdownSecs} />
          : <span className="text-xs font-mono text-muted tabular-nums">{counterLabel ?? `Question ${qIndex} / ${total}`}</span>
        }
      </div>
    </header>
  )
}
