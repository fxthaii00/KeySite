import { useState, useEffect } from 'react';
import { subscribeKeys } from '../services/keyService';

export function useKeys() {
  const [keys,    setKeys]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeKeys(data => {
      setKeys(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { keys, loading };
}
