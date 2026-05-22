import { useEffect, useRef, useState, useCallback } from 'react';

const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_ATTEMPTS = 10;

export const useWebSocket = (url) => {
  const [isReady, setIsReady] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const ws = useRef(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef(null);
  const shouldReconnect = useRef(true);

  const connect = useCallback(() => {
    const token = sessionStorage.getItem('access_token');
    if (!token || !url) return;

    // Append JWT token as query param for Django Channels JWT middleware
    const wsUrl = url.includes('?') ? `${url}&token=${token}` : `${url}?token=${token}`;

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setIsReady(true);
      reconnectAttempts.current = 0;
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
      } catch (e) {
        console.warn('[WS] Failed to parse message:', e);
      }
    };

    ws.current.onclose = (event) => {
      setIsReady(false);
      // Don't reconnect if closed intentionally or too many attempts
      if (
        !shouldReconnect.current ||
        reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS
      ) return;

      reconnectAttempts.current += 1;
      const delay = RECONNECT_DELAY_MS * Math.min(reconnectAttempts.current, 5);
      reconnectTimer.current = setTimeout(connect, delay);
    };

    ws.current.onerror = (error) => {
      console.warn('[WS] WebSocket error:', error);
      ws.current?.close();
    };
  }, [url]);

  useEffect(() => {
    shouldReconnect.current = true;
    connect();

    return () => {
      shouldReconnect.current = false;
      clearTimeout(reconnectTimer.current);
      ws.current?.close();
    };
  }, [connect]);

  return { isReady, lastMessage };
};
