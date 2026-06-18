import { Outlet } from 'react-router-dom'
import { RoomProvider } from '../contexts/RoomContext.jsx'

// Shared layout that keeps RoomProvider alive across Lobby → Game navigation
// so the WebSocket connection and state are preserved.
export default function MultiplayerLayout() {
  return (
    <RoomProvider>
      <Outlet />
    </RoomProvider>
  )
}
