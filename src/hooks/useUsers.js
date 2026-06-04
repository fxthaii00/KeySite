import { useState, useEffect } from 'react';
import { subscribeUsers } from '../services/userService';

export function useUsers() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeUsers(data => {
      setUsers(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { users, loading };
}
