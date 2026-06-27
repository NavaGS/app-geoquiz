import { createContext, useContext, useReducer, useRef, useCallback, useEffect } from 'react'
import { useStompClient } from '../hooks/useStompClient.js'

const RoomContext = createContext(null)

const initialState = {
  roomCode: null,
  quizMode: null,
  region: null,
  difficultyRating: 2,
  difficultyMode: 'inclusive',
  maxQuestions: 10,
  questionDurationSeconds: 10,
  responseAttempts: 'unlimited',
  players: [],
  playerId: null,
  displayName: null,
  isHost: false,
  hostToken: null,
  // game
  // LOBBY | STARTING | QUESTION | SUBMITTED | RESULTS | ENDED
  // STARTING = game has been initiated but first QUESTION_STARTED has not yet arrived
  phase: 'LOBBY',
  question: null,  // { questionIndex, isoA2, flagUrl, countryName, durationSeconds, serverStartTimeMs, totalQuestions }
  answerResult: null, // { correct, points, canonicalAnswer }
  leaderboard: [],
  finalLeaderboard: [],
  correctAnswer: null,
  gameStartError: null, // set if QUESTION_STARTED never arrives after GAME_STARTED
}

function reducer(state, action) {
  switch (action.type) {
    case 'INIT_ROOM':
      return { ...state, ...action.payload }
    case 'PLAYER_JOINED':
    case 'PLAYER_LEFT':
      return { ...state, players: action.payload.players ?? state.players }
    case 'SETTINGS_UPDATED':
      return {
        ...state,
        difficultyRating: action.payload.difficultyRating,
        difficultyMode: action.payload.difficultyMode,
        maxQuestions: action.payload.maxQuestions,
        questionDurationSeconds: action.payload.questionDurationSeconds,
        responseAttempts: action.payload.responseAttempts,
      }
    case 'GAME_STARTED':
      // Transition to a distinct STARTING phase so Lobby can distinguish
      // "waiting for players" from "waiting for first question".
      return { ...state, phase: 'STARTING', gameStartError: null }
    case 'QUESTION_STARTED':
      return { ...state, phase: 'QUESTION', question: action.payload, answerResult: null, correctAnswer: null, gameStartError: null }
    case 'GAME_START_TIMEOUT':
      // QUESTION_STARTED never arrived — let the user recover by resetting to LOBBY.
      return { ...state, phase: 'LOBBY', gameStartError: 'Game start timed out — please try again.' }
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
  const gameStartTimeoutRef = useRef(null)

  const setupSubscriptions = useCallback((roomCode, playerId) => {
    clearTimeout(gameStartTimeoutRef.current)
    subscriptionsRef.current.forEach(unsub => unsub())
    subscriptionsRef.current = []

    const roomUnsub = subscribe(`/topic/room/${roomCode}`, (msg) => {
      dispatch({ type: msg.type, payload: msg })
      if (msg.type === 'GAME_STARTED') {
        // Start a recovery window — if QUESTION_STARTED doesn't arrive within
        // 8 seconds the client dispatches a timeout so the host can retry.
        clearTimeout(gameStartTimeoutRef.current)
        gameStartTimeoutRef.current = setTimeout(() => {
          dispatch({ type: 'GAME_START_TIMEOUT' })
        }, 8000)
      } else if (msg.type === 'QUESTION_STARTED') {
        clearTimeout(gameStartTimeoutRef.current)
      }
    })

    const playerUnsub = subscribe(`/topic/room/${roomCode}/player/${playerId}`, (msg) => {
      dispatch({ type: msg.type, payload: msg })
    })

    subscriptionsRef.current = [roomUnsub, playerUnsub]
  }, [subscribe])

  useEffect(() => {
    return () => {
      subscriptionsRef.current.forEach(unsub => unsub?.())
      clearTimeout(gameStartTimeoutRef.current)
    }
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
      ...state,          // includes gameStartError
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
