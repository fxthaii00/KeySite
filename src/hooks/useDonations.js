import { useState, useEffect } from 'react';
import { subscribeDonations } from '../services/donationService';

export function useDonations() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeDonations(data => {
      setDonations(data);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { donations, loading };
}
