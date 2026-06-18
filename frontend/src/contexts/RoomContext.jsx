import { createContext, useContext, useReducer, useRef, useCallback, useEffect } from 'react'
import { useStompClient } from '../hooks/useStompClient.js'

const RoomContext = createContext(null)

const initialState = {
  roomCode: null,
  quizMode: null,
  region: null,
  difficultyRating: 5,
  difficultyMode: 'inclusive',
  maxQuestions: 15,
  questionDurationSeconds: 20,
  responseAttempts: 'unlimited',
  players: [],
  playerId: null,
  displayName: null,
  isHost: false,
  hostToken: null,
  // game
  phase: 'LOBBY', // LOBBY | QUESTION | SUBMITTED | RESULTS | ENDED
  question: null,  // { questionIndex, isoA2, flagUrl, countryName, durationSeconds, serverStartTimeMs, totalQuestions }
  answerResult: null, // { correct, points, canonicalAnswer }
  leaderboard: [],
  finalLeaderboard: [],
  correctAnswer: null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'INIT_ROOM':
      return { ...state, ...action.payload }
    case 'PLAYER_JOINED':
    case 'PLAYER_LEFT':
      return { ...state, players: action.payload.players ?? state.players }
    case 'GAME_STARTED':
      return { ...state, phase: 'LOBBY' }
    case 'QUESTION_STARTED':
      return { ...state, phase: 'QUESTION', question: action.payload, answerResult: null, correctAnswer: null }
    case 'ANSWER_RESULT':
      // Unlimited mode: wrong answer keeps the input active so the player can retry
      if (state.responseAttempts === 'unlimited' && action.payload.correct === false) {
        return { ...state, answerResult: action.payload }
      }
      return { ...state, phase: 'SUBMITTED', answerResult: action.payload }
    case 'QUESTION_ENDED':
      return { ...state, phase: 'RESULTS', correctAnswer: action.payload.correctAnswer, leaderboard: action.payload.leaderboard }
    case 'GAME_ENDED':
      return { ...state, phase: 'ENDED', finalLeaderboard: action.payload.finalLeaderboard }
    default:
      return state
  }
}

export function RoomProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { connected, subscribe, publish } = useStompClient()
  const subscriptionsRef = useRef([])

  const setupSubscriptions = useCallback((roomCode, playerId) => {
    subscriptionsRef.current.forEach(unsub => unsub())
    subscriptionsRef.current = []

    const roomUnsub = subscribe(`/topic/room/${roomCode}`, (msg) => {
      dispatch({ type: msg.type, payload: msg })
    })

    const playerUnsub = subscribe(`/topic/room/${roomCode}/player/${playerId}`, (msg) => {
      dispatch({ type: msg.type, payload: msg })
    })

    subscriptionsRef.current = [roomUnsub, playerUnsub]
  }, [subscribe])

  useEffect(() => {
    return () => subscriptionsRef.current.forEach(unsub => unsub?.())
  }, [])

  const initRoom = useCallback(({ roomCode, playerId, displayName, isHost, hostToken, quizMode, region, difficultyRating, difficultyMode, maxQuestions, questionDurationSeconds, responseAttempts }) => {
    dispatch({ type: 'INIT_ROOM', payload: { roomCode, playerId, displayName, isHost, hostToken, quizMode, region, difficultyRating, difficultyMode, maxQuestions, questionDurationSeconds, responseAttempts } })
    setupSubscriptions(roomCode, playerId)
  }, [setupSubscriptions])

  const announceJoin = useCallback((roomCode, playerId, displayName) => {
    publish('/app/room/join', { roomCode, playerId, displayName })
  }, [publish])

  const announceLeave = useCallback((roomCode, playerId) => {
    publish('/app/room/leave', { roomCode, playerId })
  }, [publish])

  const startGame = useCallback((roomCode, hostToken) => {
    publish('/app/game/start', { roomCode, hostToken })
  }, [publish])

  const submitAnswer = useCallback((roomCode, playerId, questionIndex, answer, responseAttempts) => {
    publish('/app/game/answer', { roomCode, playerId, questionIndex, answer })
    // Single mode: optimistically lock the input immediately while waiting for server
    if (responseAttempts === 'single') {
      dispatch({ type: 'ANSWER_RESULT', payload: { correct: null, points: null, canonicalAnswer: null } })
    }
  }, [publish])

  const updatePlayers = useCallback((players) => {
    dispatch({ type: 'PLAYER_JOINED', payload: { players } })
  }, [])

  return (
    <RoomContext.Provider value={{
      ...state,
      connected,
      initRoom,
      announceJoin,
      announceLeave,
      startGame,
      submitAnswer,
      updatePlayers,
    }}>
      {children}
    </RoomContext.Provider>
  )
}

export function useRoom() {
  const ctx = useContext(RoomContext)
  if (!ctx) throw new Error('useRoom must be used within RoomProvider')
  return ctx
}
