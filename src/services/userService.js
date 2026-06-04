import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

export function subscribeUsers(callback) {
  const q = query(collection(db, 'users'), orderBy('lastSeen', 'desc'));
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
}
