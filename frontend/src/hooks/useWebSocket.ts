import { useEffect, useRef } from "react";

export const useWebSocket = (url: string, onMessage: (data: MessageEvent) => void) => {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(url);
    ws.onmessage = onMessage;
    wsRef.current = ws;
    return () => ws.close();
  }, [url, onMessage]);

  return wsRef.current;
};
