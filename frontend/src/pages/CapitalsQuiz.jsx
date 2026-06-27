import FlipQuiz from '../components/FlipQuiz.jsx'

function filterFn(c) { return !!c.capital && c.capital.trim() !== '' }
function getQuestion(c) { return { iso: c.isoA2, question: c.nameCommon } }
function getCanonical(c) { return c.capital }

function renderFront(c) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <p className="text-xs text-muted font-medium uppercase tracking-widest">What is the capital of?</p>
      {c.flagPngUrl && (
        <img src={c.flagPngUrl} alt="flag" className="h-12 object-contain rounded shadow-sm border border-border-col" />
      )}
      <p className="text-2xl font-bold text-primary tracking-tight">{c.nameCommon}</p>
    </div>
  )
}

function renderBack(c) {
  return (
    <div className="text-center">
      <p className="text-sm text-muted mb-1">Capital of {c.nameCommon}</p>
      <p className="text-3xl font-bold text-primary tracking-tight">{c.capital || 'N/A'}</p>
    </div>
  )
}

export default function CapitalsQuiz() {
  return (
    <FlipQuiz
      mode="capitals"
      modeName="Capital City"
      accentColor="#EA580C"
      filterFn={filterFn}
      getQuestion={getQuestion}
      getCanonical={getCanonical}
      renderFront={renderFront}
      renderBack={renderBack}
    />
  )
}
