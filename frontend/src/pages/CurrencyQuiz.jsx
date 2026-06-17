import FlipQuiz from '../components/FlipQuiz.jsx'

export default function CurrencyQuiz() {
  return (
    <FlipQuiz
      mode="currency"
      modeName="Currency"
      accentColor="#CA8A04"
      filterFn={c => !!c.currencyName}
      getQuestion={c => ({ iso: c.isoA2, question: c.nameCommon })}
      renderFront={c => (
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-xs text-muted uppercase tracking-widest">Which country uses this currency?</p>
          <p className="text-5xl font-bold text-primary">{c.currencySymbol || c.currencyCode}</p>
          <p className="text-2xl font-semibold text-primary">{c.currencyName}</p>
          <p className="text-sm text-muted font-mono">{c.currencyCode}</p>
        </div>
      )}
      renderBack={c => (
        <div className="text-center">
          <p className="text-2xl font-bold text-primary tracking-tight">{c.nameCommon}</p>
          {c.flagPngUrl && (
            <div style={{ width: 240, height: 160 }} className="mx-auto mt-3 rounded-lg overflow-hidden border border-border-col shadow-sm">
              <img src={c.flagPngUrl} alt="flag" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          )}
          <p className="text-xs text-muted mt-2">{c.region}{c.subregion ? ` · ${c.subregion}` : ''}</p>
        </div>
      )}
    />
  )
}
