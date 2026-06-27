import { useEffect, useRef, useState, useCallback } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { BASE_WS_URL } from '../api/client.js'

export function useStompClient() {
  const clientRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const pendingSubscriptions = useRef([])
  const pendingPublishes = useRef([])  // 5.1: buffer messages sent while disconnected

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(`${BASE_WS_URL}/ws`),
      reconnectDelay: 3000,
      onConnect: () => {
        setConnected(true)

        // 5.1: flush any messages queued during disconnection before subscribing
        const queued = pendingPublishes.current.splice(0)
        queued.forEach(({ destination, body }) => {
          client.publish({ destination, body })
        })

        // 5.2: drain pending subscriptions (uses splice to avoid mutation during iteration)
        const subs = pendingSubscriptions.current.splice(0)
        subs.forEach(({ topic, handler }) => {
          client.subscribe(topic, (frame) => handler(JSON.parse(frame.body)))
        })
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
      // 5.2: use object identity for cleanup so multiple pending subs on the same
      // topic don't accidentally remove each other
      const pending = { topic, handler }
      pendingSubscriptions.current.push(pending)
      return () => {
        pendingSubscriptions.current = pendingSubscriptions.current.filter(s => s !== pending)
      }
    }
  }, [])

  const publish = useCallback((destination, body) => {
    const serialized = JSON.stringify(body)
    if (clientRef.current?.connected) {
      clientRef.current.publish({ destination, body: serialized })
    } else {
      // 5.1: queue the message; it will be sent as soon as the connection restores
      pendingPublishes.current.push({ destination, body: serialized })
    }
  }, [])

  return { connected, subscribe, publish }
}
