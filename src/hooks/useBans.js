import { useState, useEffect } from 'react';
import { subscribeBans } from '../services/banService';

export function useBans() {
  const [bans,    setBans]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeBans(data => {
      setBans(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { bans, loading };
}
