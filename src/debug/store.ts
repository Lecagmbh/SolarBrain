import { useEffect, useState } from 'react';
import type { DebugLogEntry } from './logger';
import { subscribeDebugLogs } from './logger';

const MAX_LOGS = 300;

export function useDebugLogs() {
  const [logs, setLogs] = useState<DebugLogEntry[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeDebugLogs((entry) => {
      setLogs((prev) => {
        const next = [entry, ...prev];
        if (next.length > MAX_LOGS) {
          return next.slice(0, MAX_LOGS);
        }
        return next;
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return logs;
}
