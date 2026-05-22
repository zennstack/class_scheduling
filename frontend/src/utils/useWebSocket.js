import { useEffect, useRef, useState } from 'react';

export const useWebSocket = (url) => {
  const [isReady, setIsReady] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const ws = useRef(null);

  useEffect(() => {
    // Connect to websocket
    const token = sessionStorage.getItem('access_token');
    if (!token) return;

    ws.current = new WebSocket(`${url}?token=${token}`);

    ws.current.onopen = () => {
      setIsReady(true);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLastMessage(data);
    };

    ws.current.onclose = () => {
      setIsReady(false);
    };

    return () => {
      ws.current?.close();
    };
  }, [url]);

  return { isReady, lastMessage, ws: ws.current };
};
