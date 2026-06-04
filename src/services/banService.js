import {
  collection, doc, addDoc, updateDoc,
  query, where, onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';

export function subscribeBans(callback) {
  const q = query(collection(db, 'bans'), where('active', '==', true));
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
}

export async function createBan({ userId, hwid, key, reason, duration, bannedBy }) {
  return addDoc(collection(db, 'bans'), {
    userId:    userId || null,
    hwid:      hwid   || null,
    key:       key    || null,
    reason,
    bannedBy,
    active:    true,
    createdAt: Date.now(),
    expiresAt: duration ? Date.now() + duration * 86_400_000 : null,
  });
}

export async function removeBan(banId) {
  await updateDoc(doc(db, 'bans', banId), { active: false });
}
