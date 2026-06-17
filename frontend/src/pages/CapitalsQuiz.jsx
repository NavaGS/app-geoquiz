import FlipQuiz from '../components/FlipQuiz.jsx'

export default function CapitalsQuiz() {
  return (
    <FlipQuiz
      mode="capitals"
      accentColor="orange"
      filterFn={c => !!c.capital && c.capital.trim() !== ''}
      getQuestion={c => ({ iso: c.isoA2, question: c.nameCommon })}
      renderFront={c => (
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">What is the capital of?</p>
          {c.flagPngUrl && (
            <img src={c.flagPngUrl} alt="flag" className="h-12 object-contain rounded shadow" />
          )}
          <p className="text-2xl font-bold text-gray-800">{c.nameCommon}</p>
        </div>
      )}
      renderBack={c => (
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">Capital of {c.nameCommon}</p>
          <p className="text-3xl font-bold text-orange-600">{c.capital || 'N/A'}</p>
        </div>
      )}
    />
  )
}
