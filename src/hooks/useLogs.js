import { useState, useEffect } from 'react';
import { subscribeLogs } from '../services/logService';

export function useLogs(maxItems = 300) {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeLogs(data => {
      setLogs(data);
      setLoading(false);
    }, maxItems);
    return unsub;
  }, [maxItems]);

  return { logs, loading };
}
