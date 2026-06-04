import {
  collection, addDoc, getDocs, deleteDoc,
  doc, query, orderBy, limit, onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';

export function subscribeLogs(callback, maxItems = 300) {
  const q = query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(maxItems));
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
}

export async function addLog(action, details, adminEmail = 'system') {
  await addDoc(collection(db, 'logs'), {
    action,
    timestamp:  Date.now(),
    adminEmail,
    ...details,
  }).catch(() => {});
}

export async function clearAllLogs() {
  const snap = await getDocs(collection(db, 'logs'));
  await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'logs', d.id))));
}
