import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
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
import GameAnalytics from './pages/GameAnalytics.jsx'
import AdminCentre from './pages/AdminCentre.jsx'
import SessionEnd from './pages/SessionEnd.jsx'
import MultiplayerHome from './pages/MultiplayerHome.jsx'
import CreateRoom from './pages/CreateRoom.jsx'
import JoinRoom from './pages/JoinRoom.jsx'
import Lobby from './pages/Lobby.jsx'
import MultiplayerGame from './pages/MultiplayerGame.jsx'
import MultiplayerLayout from './pages/MultiplayerLayout.jsx'

export default function App() {
  return (
    <>
      <Navbar />
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
        <Route path="/game-analytics" element={<GameAnalytics />} />
        <Route path="/admin" element={<AdminCentre />} />
        <Route path="/session-end" element={<SessionEnd />} />
        <Route path="/multiplayer" element={<MultiplayerHome />} />
        <Route path="/room/create" element={<CreateRoom />} />
        <Route path="/room/join" element={<JoinRoom />} />
        {/* Shared RoomProvider keeps WebSocket alive across Lobby → Game */}
        <Route element={<MultiplayerLayout />}>
          <Route path="/room/:code" element={<Lobby />} />
          <Route path="/game/:code" element={<MultiplayerGame />} />
        </Route>
      </Routes>
    </>
  )
}
