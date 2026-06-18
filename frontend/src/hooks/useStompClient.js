import { useEffect, useRef, useState, useCallback } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { BASE_WS_URL } from '../api/client.js'

export function useStompClient() {
  const clientRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const pendingSubscriptions = useRef([])

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(`${BASE_WS_URL}/ws`),
      reconnectDelay: 3000,
      onConnect: () => {
        setConnected(true)
        pendingSubscriptions.current.forEach(({ topic, handler }) => {
          client.subscribe(topic, (frame) => handler(JSON.parse(frame.body)))
        })
        pendingSubscriptions.current = []
      },
      onDisconnect: () => setConnected(false),
      onStompError: (frame) => console.error('STOMP error', frame),
    })

    client.activate()
    clientRef.current = client

    return () => {
      client.deactivate()
    }
  }, [])

  const subscribe = useCallback((topic, handler) => {
    const client = clientRef.current
    if (client?.connected) {
      const sub = client.subscribe(topic, (frame) => handler(JSON.parse(frame.body)))
      return () => sub.unsubscribe()
    } else {
      pendingSubscriptions.current.push({ topic, handler })
      return () => {
        pendingSubscriptions.current = pendingSubscriptions.current.filter(s => s.topic !== topic)
      }
    }
  }, [])

  const publish = useCallback((destination, body) => {
    clientRef.current?.publish({
      destination,
      body: JSON.stringify(body),
    })
  }, [])

  return { connected, subscribe, publish }
}
