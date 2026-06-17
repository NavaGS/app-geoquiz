import FlipQuiz from '../components/FlipQuiz.jsx'

export default function FlagsQuiz() {
  return (
    <FlipQuiz
      mode="flags"
      accentColor="blue"
      filterFn={c => !!c.flagPngUrl}
      getQuestion={c => ({ iso: c.isoA2, question: c.nameCommon })}
      renderFront={c => (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Which country is this flag?</p>
          {c.flagPngUrl
            ? <div style={{ width: 240, height: 160 }} className="rounded shadow overflow-hidden border border-gray-200">
                <img src={c.flagPngUrl} alt="flag" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
            : <div style={{ width: 240, height: 160 }} className="bg-gray-200 rounded flex items-center justify-center text-gray-400">No flag</div>
          }
        </div>
      )}
      renderBack={c => (
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-800">{c.nameCommon}</p>
          <p className="text-sm text-gray-500 mt-1">{c.nameOfficial}</p>
          <p className="text-xs text-gray-400 mt-1">{c.region} · {c.subregion}</p>
        </div>
      )}
    />
  )
}
