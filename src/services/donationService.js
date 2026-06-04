import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

export function subscribeDonations(callback) {
  const q = collection(db, 'donations');
  return onSnapshot(q, snap => {
    const donations = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    donations.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });
    callback(donations);
  });
}
