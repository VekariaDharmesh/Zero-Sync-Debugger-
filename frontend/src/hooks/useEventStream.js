import { useEffect, useRef, useCallback } from "react";

export function useEventStream(url, onMessage) {
  const esRef = useRef(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    if (esRef.current) esRef.current.close();
    const es = new EventSource(url);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type !== "ping") onMessageRef.current(data);
      } catch {}
    };
    es.onerror = () => {
      es.close();
      setTimeout(connect, 3000);
    };
    esRef.current = es;
  }, [url]);

  useEffect(() => {
    connect();
    return () => esRef.current?.close();
  }, [connect]);
}
