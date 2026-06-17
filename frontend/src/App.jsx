import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import FlagsQuiz from './pages/FlagsQuiz.jsx'
import MapQuiz from './pages/MapQuiz.jsx'
import CapitalsQuiz from './pages/CapitalsQuiz.jsx'
import CitiesQuiz from './pages/CitiesQuiz.jsx'
import ShapesQuiz from './pages/ShapesQuiz.jsx'
import CurrencyQuiz from './pages/CurrencyQuiz.jsx'
import LanguageQuiz from './pages/LanguageQuiz.jsx'
import BordersQuiz from './pages/BordersQuiz.jsx'
import Monitoring from './pages/Monitoring.jsx'
import AdminCentre from './pages/AdminCentre.jsx'
import SessionEnd from './pages/SessionEnd.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/quiz/flags" element={<FlagsQuiz />} />
      <Route path="/quiz/map" element={<MapQuiz />} />
      <Route path="/quiz/capitals" element={<CapitalsQuiz />} />
      <Route path="/quiz/cities" element={<CitiesQuiz />} />
      <Route path="/quiz/shapes" element={<ShapesQuiz />} />
      <Route path="/quiz/currency" element={<CurrencyQuiz />} />
      <Route path="/quiz/language" element={<LanguageQuiz />} />
      <Route path="/quiz/borders" element={<BordersQuiz />} />
      <Route path="/monitoring" element={<Monitoring />} />
      <Route path="/admin" element={<AdminCentre />} />
      <Route path="/session-end" element={<SessionEnd />} />
    </Routes>
  )
}
