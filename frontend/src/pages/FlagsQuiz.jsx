import FlipQuiz from '../components/FlipQuiz.jsx'

// Module-level functions give FlipQuiz stable prop references across renders,
// preventing useMemo from recomputing frontContent on every timer tick.
function filterFn(c) { return !!c.flagPngUrl }
function getQuestion(c) { return { iso: c.isoA2, question: c.nameCommon } }
function getCanonical(c) { return c.nameCommon }

function renderFront(c) {
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs text-muted font-medium uppercase tracking-widest">Which country is this flag?</p>
      {c.flagPngUrl
        ? <div style={{ width: 240, height: 160 }} className="rounded-lg overflow-hidden border border-border-col shadow-sm">
            <img src={c.flagPngUrl} alt="flag" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        : <div style={{ width: 240, height: 160 }} className="bg-subtle rounded-lg flex items-center justify-center text-muted">No flag</div>
      }
    </div>
  )
}

function renderBack(c) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold text-primary tracking-tight">{c.nameCommon}</p>
      <p className="text-sm text-secondary mt-1">{c.nameOfficial}</p>
      <p className="text-xs text-muted mt-1">{c.region} · {c.subregion}</p>
    </div>
  )
}

export default function FlagsQuiz() {
  return (
    <FlipQuiz
      mode="flags"
      modeName="Flag Finder"
      accentColor="#1B3FE4"
      filterFn={filterFn}
      getQuestion={getQuestion}
      getCanonical={getCanonical}
      renderFront={renderFront}
      renderBack={renderBack}
    />
  )
}
