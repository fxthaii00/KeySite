import { useState, useEffect } from 'react';
import { subscribeGames } from '../services/gameService';

/**
 * Subscribes to real-time games list.
 * Returns { games, loading }
 */
export function useGames() {
  const [games,   setGames]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeGames(data => {
      setGames(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { games, loading };
}
