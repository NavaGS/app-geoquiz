import { useLocation, useNavigate } from 'react-router-dom'

const MODE_NAMES = {
  flags: 'Flag Recognition',
  map: 'Map Location',
  capitals: 'Capital City',
  cities: 'Major Cities',
  shapes: 'Country Shape',
}

export default function SessionEnd() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state || {}
  const { score = { correct: 0, wrong: 0, skipped: 0 }, mode, region, isNewBest } = state

  const total = score.correct + score.wrong + score.skipped
  const accuracy = total > 0 ? Math.round((score.correct / total) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Session Complete!</h1>
        <p className="text-gray-500 text-sm mb-6">{MODE_NAMES[mode] || mode} · {region}</p>

        {isNewBest && (
          <div className="mb-4 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-lg px-4 py-2 font-semibold">
            🏆 New Personal Best!
          </div>
        )}

        <table className="w-full text-sm mb-6">
          <tbody>
            <tr className="border-b">
              <td className="py-2 text-left text-gray-500">Correct</td>
              <td className="py-2 text-right font-semibold text-green-600">{score.correct}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 text-left text-gray-500">Wrong</td>
              <td className="py-2 text-right font-semibold text-red-500">{score.wrong}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 text-left text-gray-500">Skipped</td>
              <td className="py-2 text-right font-semibold text-gray-400">{score.skipped}</td>
            </tr>
            <tr>
              <td className="py-2 text-left text-gray-500">Accuracy</td>
              <td className="py-2 text-right font-bold text-blue-600">{accuracy}%</td>
            </tr>
          </tbody>
        </table>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => navigate(`/quiz/${mode}`, { state: { region, timer: 30 } })}
            className="py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600"
          >
            Play Again
          </button>
          <button
            onClick={() => navigate('/')}
            className="py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200"
          >
            Change Mode
          </button>
        </div>
      </div>
    </div>
  )
}
