import FlipQuiz from '../components/FlipQuiz.jsx'

export default function CurrencyQuiz() {
  return (
    <FlipQuiz
      mode="currency"
      accentColor="yellow"
      filterFn={c => !!c.currencyName}
      getQuestion={c => ({ iso: c.isoA2, question: c.nameCommon })}
      renderFront={c => (
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Which country uses this currency?</p>
          <p className="text-5xl font-bold text-yellow-600">{c.currencySymbol || c.currencyCode}</p>
          <p className="text-2xl font-semibold text-gray-800">{c.currencyName}</p>
          <p className="text-sm text-gray-400">{c.currencyCode}</p>
        </div>
      )}
      renderBack={c => (
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-800">{c.nameCommon}</p>
          {c.flagPngUrl && (
            <div style={{ width: 240, height: 160 }} className="mx-auto mt-3 rounded shadow overflow-hidden border border-gray-200">
              <img src={c.flagPngUrl} alt="flag" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2">{c.region}{c.subregion ? ` · ${c.subregion}` : ''}</p>
        </div>
      )}
    />
  )
}
